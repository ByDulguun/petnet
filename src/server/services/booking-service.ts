// Booking domain service. Bookings persist as `Appointment` rows — the
// schema's `Booking` model is reserved for multi-day stays (checkIn/checkOut,
// pet hotels/boarding); a single date+time service appointment is exactly
// what `Appointment` models, so that's what backs the existing booking UI.

import { prisma } from "@/lib/prisma";
import type { BookingConfirmation } from "@/lib/types";
import { getAvailableSlots } from "@/server/services/business-service";
import { createNotification } from "@/server/services/notification-service";

export class SlotConflictError extends Error {
  constructor() {
    super("That slot was just taken — please pick another time");
  }
}

// Cancellations must happen at least this long before the appointment —
// matches the "free cancellation up to 3 hours before" copy already shown
// in the booking UI, now actually enforced server-side.
const CANCELLATION_WINDOW_MS = 3 * 60 * 60 * 1000;

export async function getBookingsForUser(userId: string) {
  const appointments = await prisma.appointment.findMany({
    where: { userId },
    include: {
      business: { select: { name: true, slug: true, coverUrl: true } },
      service: { select: { name: true, priceMnt: true } },
      pet: { select: { name: true, avatarUrl: true } },
    },
    orderBy: { startsAt: "desc" },
  });

  const now = new Date();
  const upcoming = appointments.filter(
    (a) => a.status !== "CANCELLED" && a.status !== "COMPLETED" && a.startsAt >= now,
  );
  const past = appointments.filter(
    (a) => a.status !== "CANCELLED" && (a.status === "COMPLETED" || a.startsAt < now),
  );
  const cancelled = appointments.filter((a) => a.status === "CANCELLED");

  return { upcoming, past, cancelled };
}

export type CancelBookingResult = { ok: true } | { ok: false; error: string; status: number };

export async function cancelBooking(id: string, userId: string): Promise<CancelBookingResult> {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { business: { select: { name: true } } },
  });
  if (!appointment || appointment.userId !== userId) {
    return { ok: false, error: "Booking not found", status: 404 };
  }
  if (appointment.status === "CANCELLED") {
    return { ok: false, error: "This booking is already cancelled", status: 400 };
  }
  if (appointment.status === "COMPLETED") {
    return { ok: false, error: "This booking has already been completed", status: 400 };
  }
  if (appointment.startsAt.getTime() - Date.now() < CANCELLATION_WINDOW_MS) {
    return {
      ok: false,
      error: "Cancellations must be made at least 3 hours before the appointment",
      status: 400,
    };
  }

  await prisma.appointment.update({ where: { id }, data: { status: "CANCELLED" } });

  await createNotification(userId, {
    type: "BOOKING",
    title: `Booking cancelled at ${appointment.business.name}`,
    href: "/bookings",
  });

  return { ok: true };
}

export type CreateBookingResult =
  | { ok: true; confirmation: BookingConfirmation }
  | { ok: false; error: string; status: number };

export async function createBooking(input: {
  userId: string;
  businessSlug: string;
  serviceId: string;
  petId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  note?: string;
}): Promise<CreateBookingResult> {
  const business = await prisma.business.findUnique({
    where: { slug: input.businessSlug },
    select: { id: true, name: true, status: true, ownerId: true },
  });
  if (!business || business.status !== "ACTIVE") {
    return { ok: false, error: "Business not found", status: 404 };
  }
  // A business owner booking their own business would let them complete
  // their own appointment and post a self-authored "verified" review.
  if (business.ownerId === input.userId) {
    return { ok: false, error: "You can't book an appointment at your own business", status: 400 };
  }

  const service = await prisma.service.findUnique({ where: { id: input.serviceId } });
  if (!service || service.businessId !== business.id || !service.isBookable) {
    return { ok: false, error: "This service is not bookable", status: 400 };
  }

  // Ownership: the pet must belong to the requesting user — never trust a
  // client-supplied petId without checking it server-side.
  const pet = await prisma.pet.findUnique({
    where: { id: input.petId },
    select: { ownerId: true },
  });
  if (!pet || pet.ownerId !== input.userId) {
    return { ok: false, error: "Pet not found", status: 404 };
  }

  const todayUb = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ulaanbaatar",
  }).format(new Date());
  if (input.date < todayUb) {
    return { ok: false, error: "That date has already passed", status: 400 };
  }

  const slots = await getAvailableSlots(input.businessSlug, input.serviceId, input.date);
  const slot = slots.find((s) => s.time === input.time);
  if (!slot) {
    return { ok: false, error: "That time is outside the business's working hours", status: 400 };
  }
  if (!slot.available) {
    return { ok: false, error: "That slot was just taken — please pick another time", status: 409 };
  }

  const durationMin = service.durationMin ?? 30;
  const startsAt = new Date(`${input.date}T${input.time}:00+08:00`);
  const endsAt = new Date(startsAt.getTime() + durationMin * 60_000);

  try {
    // Serializable isolation + an explicit re-check inside the transaction:
    // if two requests race for the same slot, Postgres/Prisma will abort and
    // retry one of them, and the retry's re-check will see the other's
    // now-committed row and throw — the DB itself prevents the double-book,
    // not just the pre-check above.
    const appointment = await prisma.$transaction(
      async (tx) => {
        const conflict = await tx.appointment.findFirst({
          where: {
            businessId: business.id,
            serviceId: service.id,
            startsAt,
            status: { not: "CANCELLED" },
          },
          select: { id: true },
        });
        if (conflict) throw new SlotConflictError();

        return tx.appointment.create({
          data: {
            userId: input.userId,
            businessId: business.id,
            serviceId: service.id,
            petId: input.petId,
            status: "PENDING", // the business confirms/declines from its dashboard (Phase 7)
            startsAt,
            endsAt,
            note: input.note || undefined,
          },
        });
      },
      { isolationLevel: "Serializable" },
    );

    await createNotification(input.userId, {
      type: "BOOKING",
      title: `Booking request sent to ${business.name}`,
      body: `${service.name} · ${input.date} at ${input.time}`,
      href: "/bookings",
    });

    return {
      ok: true,
      confirmation: {
        id: appointment.id,
        businessName: business.name,
        serviceName: service.name,
        date: input.date,
        time: input.time,
        durationMin,
        priceMnt: service.priceMnt ?? undefined,
      },
    };
  } catch (err) {
    if (err instanceof SlotConflictError) {
      return { ok: false, error: err.message, status: 409 };
    }
    throw err;
  }
}

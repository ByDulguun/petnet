import type { AppointmentStatus } from "@prisma/client";
import { revalidateTag } from "next/cache";

import { GeocodingUnavailableError, geocodeAddress, type Coordinates } from "@/lib/geocoding";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/server/services/notification-service";

// ── appointments ─────────────────────────────────────────────────────────────

export async function getBusinessAppointments(businessId: string) {
  return prisma.appointment.findMany({
    where: { businessId },
    include: {
      user: { select: { name: true, email: true } },
      pet: { select: { name: true } },
      service: { select: { name: true, priceMnt: true } },
    },
    orderBy: { startsAt: "desc" },
  });
}

// Only these forward transitions are legal — a business can move a request
// along or cancel it, never resurrect a finished/cancelled one.
const ALLOWED_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

const NOTIFY_TITLE: Partial<Record<AppointmentStatus, (business: string) => string>> = {
  CONFIRMED: (b) => `Booking confirmed at ${b}`,
  CANCELLED: (b) => `Booking cancelled by ${b}`,
  COMPLETED: (b) => `Visit completed at ${b}`,
};

export type UpdateAppointmentResult = { ok: true } | { ok: false; error: string; status: number };

export async function updateAppointmentStatus(
  appointmentId: string,
  businessId: string,
  nextStatus: AppointmentStatus,
): Promise<UpdateAppointmentResult> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { business: { select: { name: true } }, service: { select: { name: true } } },
  });
  // Same 404 whether it doesn't exist or belongs to another business —
  // never confirm another business's appointment id exists.
  if (!appointment || appointment.businessId !== businessId) {
    return { ok: false, error: "Appointment not found", status: 404 };
  }

  const allowed = ALLOWED_TRANSITIONS[appointment.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    return {
      ok: false,
      error: `Cannot move a ${appointment.status.toLowerCase()} appointment to ${nextStatus.toLowerCase()}`,
      status: 400,
    };
  }

  await prisma.appointment.update({ where: { id: appointmentId }, data: { status: nextStatus } });

  const titleFn = NOTIFY_TITLE[nextStatus];
  if (titleFn) {
    await createNotification(appointment.userId, {
      type: "BOOKING",
      title: titleFn(appointment.business.name),
      body: appointment.service?.name,
      href: "/bookings",
    });
  }

  return { ok: true };
}

// ── services ─────────────────────────────────────────────────────────────────

export interface ServiceInput {
  name: string;
  description?: string;
  priceMnt?: number;
  durationMin?: number;
  isActive: boolean;
}

export async function getBusinessServices(businessId: string) {
  return prisma.service.findMany({ where: { businessId }, orderBy: { createdAt: "asc" } });
}

export async function createBusinessService(businessId: string, input: ServiceInput) {
  const service = await prisma.service.create({
    data: { businessId, isBookable: true, ...input },
  });
  revalidateTag("businesses");
  return service;
}

export async function updateBusinessService(
  serviceId: string,
  businessId: string,
  input: ServiceInput,
) {
  const existing = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { businessId: true },
  });
  if (!existing || existing.businessId !== businessId) return null;

  const service = await prisma.service.update({ where: { id: serviceId }, data: input });
  revalidateTag("businesses");
  return service;
}

export async function setServiceActive(
  serviceId: string,
  businessId: string,
  isActive: boolean,
): Promise<boolean> {
  const existing = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { businessId: true },
  });
  if (!existing || existing.businessId !== businessId) return false;

  await prisma.service.update({ where: { id: serviceId }, data: { isActive } });
  revalidateTag("businesses");
  return true;
}

// ── hours ────────────────────────────────────────────────────────────────────

export interface HourInput {
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  is24h: boolean;
}

export async function getBusinessHours(businessId: string) {
  return prisma.businessHour.findMany({ where: { businessId }, orderBy: { dayOfWeek: "asc" } });
}

export async function setBusinessHours(businessId: string, hours: HourInput[]): Promise<void> {
  await prisma.$transaction(
    hours.map((h) =>
      prisma.businessHour.upsert({
        where: { businessId_dayOfWeek: { businessId, dayOfWeek: h.dayOfWeek } },
        update: { opensAt: h.opensAt, closesAt: h.closesAt, is24h: h.is24h },
        create: {
          businessId,
          dayOfWeek: h.dayOfWeek,
          opensAt: h.opensAt,
          closesAt: h.closesAt,
          is24h: h.is24h,
        },
      }),
    ),
  );
  revalidateTag("businesses");
}

// ── profile ──────────────────────────────────────────────────────────────────

export interface ProfileInput {
  name: string;
  categoryId: string;
  phone?: string;
  description?: string;
  address?: string;
  district?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
}

export type UpdateProfileResult =
  | { ok: true; business: Awaited<ReturnType<typeof prisma.business.update>> }
  | { ok: false; error: string; status: number };

export async function updateBusinessProfile(
  businessId: string,
  input: ProfileInput,
): Promise<UpdateProfileResult> {
  const current = await prisma.business.findUnique({
    where: { id: businessId },
    select: { address: true, district: true, city: true },
  });
  if (!current) return { ok: false, error: "Business not found", status: 404 };

  const nextAddress = input.address || null;
  const nextDistrict = input.district || null;
  const addressChanged = nextAddress !== current.address || nextDistrict !== current.district;

  // Geocode once, only when the address actually changed — never on a
  // save that didn't touch location, and never silently on page load.
  let coords: Coordinates | null = null;
  if (addressChanged && (nextAddress || nextDistrict)) {
    try {
      coords = await geocodeAddress({
        address: nextAddress ?? undefined,
        district: nextDistrict ?? undefined,
        city: current.city,
      });
    } catch (err) {
      if (err instanceof GeocodingUnavailableError) {
        return {
          ok: false,
          error: "Location lookup isn't available right now — please try again later.",
          status: 503,
        };
      }
      // GeocodingNotFoundError or anything else address-shaped: reject the
      // whole update rather than saving the new address with stale/no
      // coordinates. Nothing is written — the caller's form state (what
      // they typed) is untouched since there was no successful response.
      return {
        ok: false,
        error: "We couldn't find that address — please check it and try again.",
        status: 422,
      };
    }
  }

  const business = await prisma.business.update({
    where: { id: businessId },
    data: {
      name: input.name,
      categoryId: input.categoryId,
      phone: input.phone || null,
      description: input.description || null,
      address: nextAddress,
      district: nextDistrict,
      website: input.website || null,
      facebook: input.facebook || null,
      instagram: input.instagram || null,
      tiktok: input.tiktok || null,
      ...(coords ? { latitude: coords.lat, longitude: coords.lng } : {}),
    },
  });
  revalidateTag("businesses");
  return { ok: true, business };
}

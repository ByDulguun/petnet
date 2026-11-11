// Events domain service. Any signed-in user can host an event — hostId is
// never business-gated the way AdoptionListing is — with an optional
// businessId attribution the create/update handlers only accept when the
// caller actually owns that business (checked by the caller, not here,
// same division of responsibility as pet-service.ts's ownerId scoping).

import type { EventType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "event";
  let slug = root;
  let n = 1;
  while (await prisma.event.findUnique({ where: { slug }, select: { id: true } })) {
    n += 1;
    slug = `${root}-${n}`;
  }
  return slug;
}

const eventInclude = (viewerId?: string) => ({
  host: { select: { id: true, name: true, image: true } },
  business: { select: { id: true, name: true, slug: true } },
  _count: { select: { attendees: true } },
  attendees: viewerId ? { where: { userId: viewerId }, select: { id: true } } : false,
});

function shapeEvent<T extends { attendees?: { id: string }[] | false }>(event: T) {
  const { attendees, ...rest } = event;
  return { ...rest, isAttending: Array.isArray(attendees) && attendees.length > 0 };
}

export interface EventListFilters {
  viewerId?: string;
  type?: EventType;
  past?: boolean;
}

export async function getEvents(filters: EventListFilters = {}) {
  const now = new Date();
  const events = await prisma.event.findMany({
    where: {
      type: filters.type,
      startsAt: filters.past ? { lt: now } : { gte: now },
    },
    include: eventInclude(filters.viewerId),
    orderBy: { startsAt: filters.past ? "desc" : "asc" },
    take: 60,
  });
  return events.map(shapeEvent);
}

export async function getEventById(id: string, viewerId?: string) {
  const event = await prisma.event.findUnique({ where: { id }, include: eventInclude(viewerId) });
  return event ? shapeEvent(event) : null;
}

export async function getEventForOwner(id: string, hostId: string) {
  const event = await prisma.event.findUnique({ where: { id }, include: eventInclude(hostId) });
  if (!event || event.hostId !== hostId) return null;
  return shapeEvent(event);
}

export interface EventWriteInput {
  title: string;
  description: string;
  type: EventType;
  startsAt: Date;
  endsAt?: Date | null;
  venue?: string | null;
  address?: string | null;
  capacity?: number | null;
  priceMnt?: number | null;
  businessId?: string | null;
  coverImage?: string | null;
}

export async function createEvent(hostId: string, input: EventWriteInput) {
  const slug = await uniqueSlug(input.title);
  return prisma.event.create({ data: { ...input, hostId, slug } });
}

export async function updateEvent(id: string, hostId: string, input: EventWriteInput) {
  const existing = await prisma.event.findUnique({ where: { id }, select: { hostId: true } });
  if (!existing || existing.hostId !== hostId) return null;
  return prisma.event.update({ where: { id }, data: input });
}

export async function deleteEvent(id: string, hostId: string): Promise<boolean> {
  const existing = await prisma.event.findUnique({ where: { id }, select: { hostId: true } });
  if (!existing || existing.hostId !== hostId) return false;
  await prisma.event.delete({ where: { id } });
  return true;
}

// ── RSVPs ────────────────────────────────────────────────────────────────────

export type RsvpResult = { ok: true } | { ok: false; reason: "not_found" | "full" };

export async function rsvpToEvent(userId: string, eventId: string): Promise<RsvpResult> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { capacity: true, _count: { select: { attendees: true } } },
  });
  if (!event) return { ok: false, reason: "not_found" };

  const existing = await prisma.eventAttendee.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });
  if (existing) return { ok: true };

  if (event.capacity != null && event._count.attendees >= event.capacity) {
    return { ok: false, reason: "full" };
  }

  await prisma.eventAttendee.create({ data: { eventId, userId } });
  return { ok: true };
}

export async function cancelRsvp(userId: string, eventId: string): Promise<void> {
  await prisma.eventAttendee.deleteMany({ where: { eventId, userId } });
}

export async function getAttendeesForEvent(eventId: string, hostId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { hostId: true } });
  if (!event || event.hostId !== hostId) return null;

  return prisma.eventAttendee.findMany({
    where: { eventId },
    include: { user: { select: { name: true, email: true, phone: true } } },
    orderBy: { createdAt: "asc" },
  });
}

import { NextRequest, NextResponse } from "next/server";
import type { EventType } from "@prisma/client";

import { auth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  CloudinaryConfigError,
  configErrorResponse,
  imageValidationErrorResponse,
  uploadImage,
  validateImageUpload,
} from "@/lib/cloudinary";
import { ubLocalInputToDate } from "@/lib/hours";
import { EVENT_TYPES, eventInputSchema } from "@/lib/validations/events";
import { getOwnedBusiness } from "@/server/services/business-claim-service";
import { createEvent, getEvents } from "@/server/services/event-service";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await auth();
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");
  const past = searchParams.get("tab") === "past";

  const events = await getEvents({
    viewerId: session?.user?.id,
    type: type && (EVENT_TYPES as readonly string[]).includes(type) ? (type as EventType) : undefined,
    past,
  });
  return NextResponse.json({ events });
});

// A cover photo rides along in the same multipart request as the rest of
// the form, same reasoning as community posts — an event has no natural
// "come back later" step at creation time, and this keeps a single upload
// code path shared with PATCH.
export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const limit = await checkRateLimit(`events:create:${session.user.id}`, {
    limit: 10,
    windowMs: 24 * 60 * 60 * 1000,
  });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds!);

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  const parsed = eventInputSchema.safeParse({
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? "",
    type: formData.get("type") ?? "",
    startsAt: formData.get("startsAt") ?? "",
    endsAt: formData.get("endsAt") ?? "",
    venue: formData.get("venue") ?? "",
    address: formData.get("address") ?? "",
    capacity: formData.get("capacity") ? Number(formData.get("capacity")) : undefined,
    priceMnt: formData.get("priceMnt") ? Number(formData.get("priceMnt")) : undefined,
    asBusiness: formData.get("asBusiness") === "true",
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form for errors", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  let businessId: string | null = null;
  if (parsed.data.asBusiness) {
    const business = await getOwnedBusiness(session.user.id);
    businessId = business?.id ?? null;
  }

  const coverFile = formData.get("cover");
  let coverImage: string | null = null;
  if (coverFile instanceof File && coverFile.size > 0) {
    const validated = await validateImageUpload(coverFile);
    if (!validated.ok) return imageValidationErrorResponse(validated.error);

    const uploadLimit = await checkRateLimit(`upload:${session.user.id}`, {
      limit: 20,
      windowMs: 60 * 60 * 1000,
    });
    if (!uploadLimit.allowed) return rateLimitResponse(uploadLimit.retryAfterSeconds!);

    try {
      const { url } = await uploadImage(validated.image.buffer, "petnet/events", `${session.user.id}-${Date.now()}`);
      coverImage = url;
    } catch (err) {
      if (err instanceof CloudinaryConfigError) return configErrorResponse();
      throw err;
    }
  }

  const event = await createEvent(session.user.id, {
    title: parsed.data.title,
    description: parsed.data.description,
    type: parsed.data.type,
    startsAt: ubLocalInputToDate(parsed.data.startsAt),
    endsAt: parsed.data.endsAt ? ubLocalInputToDate(parsed.data.endsAt) : null,
    venue: parsed.data.venue || null,
    address: parsed.data.address || null,
    capacity: parsed.data.capacity ?? null,
    priceMnt: parsed.data.priceMnt ?? null,
    businessId,
    coverImage,
  });

  return NextResponse.json({ event }, { status: 201 });
});

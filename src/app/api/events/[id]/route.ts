import { NextRequest, NextResponse } from "next/server";

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
import { eventInputSchema } from "@/lib/validations/events";
import { getOwnedBusiness } from "@/server/services/business-claim-service";
import { deleteEvent, getEventById, updateEvent } from "@/server/services/event-service";

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await auth();
  const { id } = await params;
  const event = await getEventById(id, session?.user?.id);
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  return NextResponse.json({ event });
});

export const PATCH = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await params;
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
  let coverImage: string | undefined;
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

  const event = await updateEvent(id, session.user.id, {
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
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  return NextResponse.json({ event });
});

export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await params;
  const ok = await deleteEvent(id, session.user.id);
  if (!ok) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
});

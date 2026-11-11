import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  CloudinaryConfigError,
  configErrorResponse,
  imageValidationErrorResponse,
  uploadImage,
  validateImageUpload,
} from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { withErrorHandling } from "@/lib/api-handler";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  // Each upload is a real Cloudinary API call (storage/bandwidth cost) —
  // cap re-uploads so a script can't spam them for free-tier exhaustion.
  // Shared bucket with the other image-upload endpoints (business logo/cover).
  const limit = await checkRateLimit(`upload:${session.user.id}`, {
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds!);

  const { id } = await params;

  // Ownership check happens before we do any work with the file — a pet id
  // that belongs to someone else looks exactly like one that doesn't exist.
  const pet = await prisma.pet.findUnique({ where: { id }, select: { ownerId: true } });
  if (!pet || pet.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Pet not found" }, { status: 404 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const validated = await validateImageUpload(file instanceof File ? file : null);
  if (!validated.ok) return imageValidationErrorResponse(validated.error);

  try {
    // A fixed public_id per pet means a re-upload overwrites the previous
    // photo in place instead of accumulating orphaned assets in Cloudinary.
    const { url } = await uploadImage(validated.image.buffer, "petnet/pets", id);
    const updated = await prisma.pet.update({
      where: { id },
      data: { avatarUrl: url },
      select: { avatarUrl: true },
    });
    return NextResponse.json({ avatarUrl: updated.avatarUrl });
  } catch (err) {
    if (err instanceof CloudinaryConfigError) return configErrorResponse();
    throw err;
  }
});

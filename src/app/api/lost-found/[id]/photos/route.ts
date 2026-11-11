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
import { addLostFoundImage, MAX_LOST_FOUND_IMAGES } from "@/server/services/lost-found-service";

export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  // Shared bucket with every other image-upload endpoint (pet photo,
  // business logo/cover) — one real per-user cap on Cloudinary spend.
  const limit = await checkRateLimit(`upload:${session.user.id}`, {
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds!);

  const { id } = await params;
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const validated = await validateImageUpload(file instanceof File ? file : null);
  if (!validated.ok) return imageValidationErrorResponse(validated.error);

  try {
    // Unlike a pet's single avatar, a report can hold several photos, so
    // each upload needs its own public_id rather than overwriting the last.
    const publicId = `${id}-${Date.now()}`;
    const { url } = await uploadImage(validated.image.buffer, "petnet/lost-found", publicId);
    const result = await addLostFoundImage(id, session.user.id, url, publicId);

    if (!result.ok) {
      if (result.reason === "not_found") {
        return NextResponse.json({ error: "Report not found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: `You can add up to ${MAX_LOST_FOUND_IMAGES} photos per report` },
        { status: 409 },
      );
    }
    return NextResponse.json({ image: result.image }, { status: 201 });
  } catch (err) {
    if (err instanceof CloudinaryConfigError) return configErrorResponse();
    throw err;
  }
});

import { revalidateTag } from "next/cache";
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
import { getOwnedBusiness } from "@/server/services/business-claim-service";
import { withErrorHandling } from "@/lib/api-handler";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  // Shared bucket with the other image-upload endpoints (pet photo,
  // business cover) — each is a real Cloudinary API call.
  const limit = await checkRateLimit(`upload:${session.user.id}`, {
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds!);

  const business = await getOwnedBusiness(session.user.id);
  if (!business) {
    return NextResponse.json({ error: "No business to manage" }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const validated = await validateImageUpload(file instanceof File ? file : null);
  if (!validated.ok) return imageValidationErrorResponse(validated.error);

  try {
    const { url } = await uploadImage(validated.image.buffer, "petnet/business-logos", business.id);
    await prisma.business.update({ where: { id: business.id }, data: { logoUrl: url } });
    revalidateTag("businesses");
    return NextResponse.json({ logoUrl: url });
  } catch (err) {
    if (err instanceof CloudinaryConfigError) return configErrorResponse();
    throw err;
  }
});

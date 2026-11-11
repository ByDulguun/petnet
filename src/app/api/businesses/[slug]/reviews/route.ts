import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { reviewCreateSchema, reviewSortSchema } from "@/lib/validations/services";
import { getBusinessDetail, getReviews } from "@/server/services/business-service";
import { createReview } from "@/server/services/review-service";
import { withErrorHandling } from "@/lib/api-handler";

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) => {
  const { slug } = await params;
  const parsed = reviewSortSchema.safeParse({
    sort: request.nextUrl.searchParams.get("sort") ?? undefined,
  });
  const sort = parsed.success ? parsed.data.sort : "newest";

  if (!(await getBusinessDetail(slug))) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  return NextResponse.json({ reviews: await getReviews(slug, sort) });
});

export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: "Sign in to write a review", code: "AUTH_REQUIRED" },
      { status: 401 },
    );
  }

  const limit = await checkRateLimit(`review:${session.user.id}`, {
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds!);

  const { slug } = await params;
  const body = await request.json().catch(() => null);
  const parsed = reviewCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid review", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const result = await createReview(session.user.id, slug, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
});

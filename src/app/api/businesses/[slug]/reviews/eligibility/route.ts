import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getReviewEligibility } from "@/server/services/review-service";
import { withErrorHandling } from "@/lib/api-handler";

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { slug } = await params;
  const business = await prisma.business.findUnique({ where: { slug }, select: { id: true } });
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const eligibility = await getReviewEligibility(session.user.id, business.id);
  return NextResponse.json(eligibility);
});

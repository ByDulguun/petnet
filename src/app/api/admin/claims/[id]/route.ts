import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { claimReviewSchema } from "@/lib/validations/business";
import { prisma } from "@/lib/prisma";
import { approveClaim, rejectClaim } from "@/server/services/business-claim-service";
import { withErrorHandling } from "@/lib/api-handler";

export const PATCH = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  // Role is re-checked fresh from the database on every request rather than
  // trusted from the session, so a promotion/demotion takes effect
  // immediately without waiting for the admin to log out and back in.
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (me?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = claimReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { id } = await params;
  const result =
    parsed.data.action === "approve"
      ? await approveClaim(id)
      : await rejectClaim(id, parsed.data.note);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
});

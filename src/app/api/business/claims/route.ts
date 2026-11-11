import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { businessClaimSchema } from "@/lib/validations/business";
import { submitClaim } from "@/server/services/business-claim-service";
import { withErrorHandling } from "@/lib/api-handler";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const limit = await checkRateLimit(`business-claim:${session.user.id}`, {
    limit: 3,
    windowMs: 24 * 60 * 60 * 1000,
  });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds!);

  const body = await request.json().catch(() => null);
  const parsed = businessClaimSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid submission", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const result = await submitClaim(session.user.id, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, claimId: result.claimId }, { status: 201 });
});

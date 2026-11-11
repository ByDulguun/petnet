import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { adoptionApplicationSchema } from "@/lib/validations/adoption";
import { createApplication, withdrawApplication } from "@/server/services/adoption-service";

const ERROR_MESSAGE: Record<string, string> = {
  not_found: "Listing not found",
  not_available: "This pet has already been adopted",
  already_applied: "You've already applied to this listing",
};

export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const limit = await checkRateLimit(`adoption:apply:${session.user.id}`, {
    limit: 20,
    windowMs: 24 * 60 * 60 * 1000,
  });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds!);

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = adoptionApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form for errors", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const result = await createApplication(id, session.user.id, {
    message: parsed.data.message,
    homeType: parsed.data.homeType || null,
    hasOtherPets: parsed.data.hasOtherPets,
  });

  if (!result.ok) {
    const status = result.reason === "not_found" ? 404 : 409;
    return NextResponse.json({ error: ERROR_MESSAGE[result.reason] }, { status });
  }
  return NextResponse.json({ application: result.application }, { status: 201 });
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
  const ok = await withdrawApplication(id, session.user.id);
  if (!ok) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
});

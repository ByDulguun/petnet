import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { bookingRequestSchema } from "@/lib/validations/services";
import { createBooking } from "@/server/services/booking-service";
import { withErrorHandling } from "@/lib/api-handler";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const limit = await checkRateLimit(`booking:${session.user.id}`, {
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds!);

  const body = await request.json().catch(() => null);
  const parsed = bookingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid booking request", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const result = await createBooking({
    userId: session.user.id,
    businessSlug: parsed.data.businessSlug,
    serviceId: parsed.data.serviceId,
    petId: parsed.data.petId,
    date: parsed.data.date,
    time: parsed.data.time,
    note: parsed.data.note,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ confirmation: result.confirmation }, { status: 201 });
});

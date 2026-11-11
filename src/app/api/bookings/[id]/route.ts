import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { cancelBooking } from "@/server/services/booking-service";
import { withErrorHandling } from "@/lib/api-handler";

// Cancels a booking. The only mutation currently exposed here, so no
// action body is needed — ownership + state checks live in the service.
export const PATCH = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await params;
  const result = await cancelBooking(id, session.user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
});

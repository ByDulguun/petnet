import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { appointmentActionSchema } from "@/lib/validations/business";
import { getOwnedBusiness } from "@/server/services/business-claim-service";
import { updateAppointmentStatus } from "@/server/services/business-portal-service";
import { withErrorHandling } from "@/lib/api-handler";

const ACTION_STATUS = {
  confirm: "CONFIRMED",
  cancel: "CANCELLED",
  complete: "COMPLETED",
} as const;

export const PATCH = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  // The business is always resolved from the session, never a client field —
  // this is what makes "Business A modifying Business B's appointment"
  // impossible even if A guesses B's appointment id.
  const business = await getOwnedBusiness(session.user.id);
  if (!business) {
    return NextResponse.json({ error: "No business to manage" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = appointmentActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { id } = await params;
  const result = await updateAppointmentStatus(id, business.id, ACTION_STATUS[parsed.data.action]);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
});

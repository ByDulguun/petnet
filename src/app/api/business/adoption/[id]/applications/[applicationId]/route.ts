import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";
import { applicationStatusSchema } from "@/lib/validations/adoption";
import { getOwnedBusiness } from "@/server/services/business-claim-service";
import { updateApplicationStatus } from "@/server/services/adoption-service";

export const PATCH = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; applicationId: string }> },
) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const business = await getOwnedBusiness(session.user.id);
  if (!business) {
    return NextResponse.json({ error: "No business to manage" }, { status: 403 });
  }

  const { applicationId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = applicationStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const result = await updateApplicationStatus(applicationId, business.id, parsed.data.status);
  if (!result.ok) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
});

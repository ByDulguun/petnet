import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { businessHoursSchema } from "@/lib/validations/business";
import { getOwnedBusiness } from "@/server/services/business-claim-service";
import { getBusinessHours, setBusinessHours } from "@/server/services/business-portal-service";
import { withErrorHandling } from "@/lib/api-handler";

export const GET = withErrorHandling(async () => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const business = await getOwnedBusiness(session.user.id);
  if (!business) {
    return NextResponse.json({ error: "No business to manage" }, { status: 403 });
  }

  const hours = await getBusinessHours(business.id);
  return NextResponse.json({ hours });
});

export const PUT = withErrorHandling(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const business = await getOwnedBusiness(session.user.id);
  if (!business) {
    return NextResponse.json({ error: "No business to manage" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = businessHoursSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid hours", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  await setBusinessHours(
    business.id,
    parsed.data.hours.map((h) => ({
      dayOfWeek: h.dayOfWeek,
      opensAt: h.is24h ? null : h.isOpen ? h.opensAt || null : null,
      closesAt: h.is24h ? null : h.isOpen ? h.closesAt || null : null,
      is24h: h.is24h,
    })),
  );

  return NextResponse.json({ ok: true });
});

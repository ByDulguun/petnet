import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { businessServiceSchema } from "@/lib/validations/business";
import { getOwnedBusiness } from "@/server/services/business-claim-service";
import { createBusinessService, getBusinessServices } from "@/server/services/business-portal-service";
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

  const services = await getBusinessServices(business.id);
  return NextResponse.json({ services });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const business = await getOwnedBusiness(session.user.id);
  if (!business) {
    return NextResponse.json({ error: "No business to manage" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = businessServiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid service", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const service = await createBusinessService(business.id, {
    name: parsed.data.name,
    description: parsed.data.description || undefined,
    priceMnt: parsed.data.priceMnt,
    durationMin: parsed.data.durationMin,
    isActive: parsed.data.isActive,
  });

  return NextResponse.json({ service }, { status: 201 });
});

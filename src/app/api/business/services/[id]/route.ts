import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { businessServiceSchema } from "@/lib/validations/business";
import { getOwnedBusiness } from "@/server/services/business-claim-service";
import { updateBusinessService } from "@/server/services/business-portal-service";
import { withErrorHandling } from "@/lib/api-handler";

export const PATCH = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
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

  const { id } = await params;
  const service = await updateBusinessService(id, business.id, {
    name: parsed.data.name,
    description: parsed.data.description || undefined,
    priceMnt: parsed.data.priceMnt,
    durationMin: parsed.data.durationMin,
    isActive: parsed.data.isActive,
  });

  // Same 404 whether the service doesn't exist or belongs to another
  // business — never confirm another business's service id exists.
  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  return NextResponse.json({ service });
});

import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { businessProfileSchema } from "@/lib/validations/business";
import { getOwnedBusiness } from "@/server/services/business-claim-service";
import { updateBusinessProfile } from "@/server/services/business-portal-service";
import { withErrorHandling } from "@/lib/api-handler";

export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const business = await getOwnedBusiness(session.user.id);
  if (!business) {
    return NextResponse.json({ error: "No business to manage" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = businessProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid profile", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  // Explicitly re-scoped to the caller's own business id — the update never
  // takes an id from the request body, so there's nothing here for a client
  // to redirect at another business even if it tried.
  const result = await updateBusinessProfile(business.id, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ business: result.business });
});

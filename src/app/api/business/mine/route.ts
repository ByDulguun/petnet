import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getOwnedBusiness } from "@/server/services/business-claim-service";
import { withErrorHandling } from "@/lib/api-handler";

// Cheap, always-fresh check used by the header to decide whether to show
// the "Business Dashboard" nav item — never the actual authorization for
// any business route, just a UI hint (see requireBusinessOwner for that).
export const GET = withErrorHandling(async () => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ hasBusiness: false });
  }

  const business = await getOwnedBusiness(session.user.id);
  return NextResponse.json({ hasBusiness: Boolean(business) });
});

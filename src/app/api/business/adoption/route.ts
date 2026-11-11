import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";
import { adoptionListingSchema } from "@/lib/validations/adoption";
import { getOwnedBusiness } from "@/server/services/business-claim-service";
import {
  createAdoptionListing,
  getAdoptionListingsForBusiness,
} from "@/server/services/adoption-service";

export const GET = withErrorHandling(async () => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  const business = await getOwnedBusiness(session.user.id);
  if (!business) {
    return NextResponse.json({ error: "No business to manage" }, { status: 403 });
  }

  const listings = await getAdoptionListingsForBusiness(business.id);
  return NextResponse.json({ listings });
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
  const parsed = adoptionListingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form for errors", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { breedId, story, feeMnt, ...rest } = parsed.data;
  const listing = await createAdoptionListing(business.id, session.user.id, {
    ...rest,
    breedId: breedId || null,
    story: story || null,
    feeMnt: feeMnt ?? null,
  });

  return NextResponse.json({ listing }, { status: 201 });
});

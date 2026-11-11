import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";
import { adoptionListingSchema } from "@/lib/validations/adoption";
import { getOwnedBusiness } from "@/server/services/business-claim-service";
import { deleteAdoptionListing, updateAdoptionListing } from "@/server/services/adoption-service";

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

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = adoptionListingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form for errors", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { breedId, story, feeMnt, ...rest } = parsed.data;
  const listing = await updateAdoptionListing(id, business.id, {
    ...rest,
    breedId: breedId || null,
    story: story || null,
    feeMnt: feeMnt ?? null,
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  return NextResponse.json({ listing });
});

export const DELETE = withErrorHandling(async (
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

  const { id } = await params;
  const ok = await deleteAdoptionListing(id, business.id);
  if (!ok) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
});

import { NextRequest, NextResponse } from "next/server";

import { withErrorHandling } from "@/lib/api-handler";
import { getAdoptionListingById } from "@/server/services/adoption-service";

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;
  const listing = await getAdoptionListingById(id);
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  return NextResponse.json({ listing });
});

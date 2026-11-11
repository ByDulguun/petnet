import { NextRequest, NextResponse } from "next/server";

import { getBusinessDetail, getNearbyBusinesses } from "@/server/services/business-service";
import { withErrorHandling } from "@/lib/api-handler";

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) => {
  const { slug } = await params;
  const lat = request.nextUrl.searchParams.get("lat");
  const lng = request.nextUrl.searchParams.get("lng");
  const near =
    lat && lng && !Number.isNaN(+lat) && !Number.isNaN(+lng)
      ? { lat: +lat, lng: +lng }
      : undefined;

  const business = await getBusinessDetail(slug, near);
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  return NextResponse.json(
    { business, nearby: await getNearbyBusinesses(slug) },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
  );
});

import { NextRequest, NextResponse } from "next/server";

import { businessSearchSchema } from "@/lib/validations/services";
import { searchBusinesses } from "@/server/services/business-service";
import { withErrorHandling } from "@/lib/api-handler";

export const dynamic = "force-dynamic"; // open-now status depends on request time

export const GET = withErrorHandling(async (request: NextRequest) => {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = businessSearchSchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { lat, lng, radiusKm, ...rest } = parsed.data;
  const result = await searchBusinesses({
    ...rest,
    near:
      lat !== undefined && lng !== undefined
        ? { lat, lng, radiusKm }
        : undefined,
  });

  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" },
  });
});

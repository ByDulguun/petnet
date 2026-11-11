import { NextRequest, NextResponse } from "next/server";

import { slotsQuerySchema } from "@/lib/validations/services";
import { getAvailableSlots, getBusinessDetail } from "@/server/services/business-service";
import { withErrorHandling } from "@/lib/api-handler";

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) => {
  const { slug } = await params;
  const parsed = slotsQuerySchema.safeParse({
    serviceId: request.nextUrl.searchParams.get("serviceId") ?? "",
    date: request.nextUrl.searchParams.get("date") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  if (!(await getBusinessDetail(slug))) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const slots = await getAvailableSlots(slug, parsed.data.serviceId, parsed.data.date);
  return NextResponse.json({ slots });
});

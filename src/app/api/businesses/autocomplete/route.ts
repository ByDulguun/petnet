import { NextRequest, NextResponse } from "next/server";

import { autocompleteSchema } from "@/lib/validations/services";
import { autocomplete } from "@/server/services/business-service";
import { withErrorHandling } from "@/lib/api-handler";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const parsed = autocompleteSchema.safeParse({
    q: request.nextUrl.searchParams.get("q") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json({ suggestions: [] });
  }

  return NextResponse.json(
    { suggestions: await autocomplete(parsed.data.q) },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
});

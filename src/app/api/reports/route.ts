import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { reportSchema } from "@/lib/validations/report";
import { submitReport } from "@/server/services/report-service";
import { withErrorHandling } from "@/lib/api-handler";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const limit = await checkRateLimit(`report:${session.user.id}`, {
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds!);

  const body = await request.json().catch(() => null);
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid report", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const result = await submitReport(session.user.id, parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
});

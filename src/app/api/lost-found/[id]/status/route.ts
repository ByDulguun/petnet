import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";
import { lostFoundStatusSchema } from "@/lib/validations/lost-found";
import { updateLostFoundStatus } from "@/server/services/lost-found-service";

// Split from the main PATCH route so the reporter can flip status (mark
// reunited / reopen) with one click from the detail page, without needing
// to resend the entire report body through the edit form's validation.
export const PATCH = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = lostFoundStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const report = await updateLostFoundStatus(id, session.user.id, parsed.data.status);
  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }
  return NextResponse.json({ report });
});

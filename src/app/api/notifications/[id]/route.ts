import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { markAsRead } from "@/server/services/notification-service";
import { withErrorHandling } from "@/lib/api-handler";

export const PATCH = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await params;
  const ok = await markAsRead(id, session.user.id);
  if (!ok) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
});

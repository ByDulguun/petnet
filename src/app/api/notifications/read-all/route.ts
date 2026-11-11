import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { markAllAsRead } from "@/server/services/notification-service";
import { withErrorHandling } from "@/lib/api-handler";

export const POST = withErrorHandling(async () => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  await markAllAsRead(session.user.id);
  return NextResponse.json({ ok: true });
});

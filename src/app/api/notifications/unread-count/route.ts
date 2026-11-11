import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getUnreadCount } from "@/server/services/notification-service";
import { withErrorHandling } from "@/lib/api-handler";

export const GET = withErrorHandling(async () => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const count = await getUnreadCount(session.user.id);
  return NextResponse.json({ count });
});

import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";
import { deleteComment } from "@/server/services/community-service";

export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await params;
  const ok = await deleteComment(id, session.user.id);
  if (!ok) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
});

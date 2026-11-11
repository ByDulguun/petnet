import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";
import { followUser, unfollowUser } from "@/server/services/community-service";

export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await params;
  if (id === session.user.id) {
    return NextResponse.json({ error: "You can't follow yourself" }, { status: 400 });
  }

  const ok = await followUser(session.user.id, id);
  if (!ok) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
});

export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await params;
  await unfollowUser(session.user.id, id);
  return NextResponse.json({ ok: true });
});

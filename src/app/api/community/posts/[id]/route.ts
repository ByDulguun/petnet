import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";
import { deletePost, getPostById } from "@/server/services/community-service";

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await auth();
  const { id } = await params;
  const post = await getPostById(id, session?.user?.id);
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  return NextResponse.json({ post });
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
  const ok = await deletePost(id, session.user.id);
  if (!ok) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
});

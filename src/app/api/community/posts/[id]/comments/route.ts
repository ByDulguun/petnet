import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { commentInputSchema } from "@/lib/validations/community";
import { createComment, getComments } from "@/server/services/community-service";

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await auth();
  const { id } = await params;
  const comments = await getComments(id, session?.user?.id);
  return NextResponse.json({ comments });
});

export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const limit = await checkRateLimit(`community:comment:${session.user.id}`, {
    limit: 60,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds!);

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = commentInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form for errors", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const comment = await createComment(id, session.user.id, {
    body: parsed.data.body,
    parentId: parsed.data.parentId || null,
  });
  if (!comment) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  return NextResponse.json({ comment }, { status: 201 });
});

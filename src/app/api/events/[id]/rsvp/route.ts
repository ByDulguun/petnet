import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";
import { cancelRsvp, rsvpToEvent } from "@/server/services/event-service";

export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await params;
  const result = await rsvpToEvent(session.user.id, id);
  if (!result.ok) {
    const status = result.reason === "not_found" ? 404 : 409;
    const error = result.reason === "not_found" ? "Event not found" : "This event is full";
    return NextResponse.json({ error }, { status });
  }
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
  await cancelRsvp(session.user.id, id);
  return NextResponse.json({ ok: true });
});

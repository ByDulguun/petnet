import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";
import { getAttendeesForEvent } from "@/server/services/event-service";

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { id } = await params;
  const attendees = await getAttendeesForEvent(id, session.user.id);
  if (!attendees) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  return NextResponse.json({ attendees });
});

import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";
import { lostFoundInputSchema } from "@/lib/validations/lost-found";
import {
  deleteLostFoundReport,
  getLostFoundReportById,
  updateLostFoundReport,
} from "@/server/services/lost-found-service";

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;
  const report = await getLostFoundReportById(id);
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });
  return NextResponse.json({ report });
});

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
  const parsed = lostFoundInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form for errors", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { petName, breedName, color, address, district, rewardMnt, lastSeenAt, ...rest } = parsed.data;
  const report = await updateLostFoundReport(id, session.user.id, {
    ...rest,
    petName: petName || null,
    breedName: breedName || null,
    color: color || null,
    address: address || null,
    district: district || null,
    rewardMnt: rewardMnt ?? null,
    lastSeenAt: new Date(`${lastSeenAt}T00:00:00Z`),
  });

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }
  return NextResponse.json({ report });
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
  const ok = await deleteLostFoundReport(id, session.user.id);
  if (!ok) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
});

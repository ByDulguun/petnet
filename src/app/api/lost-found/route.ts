import { NextRequest, NextResponse } from "next/server";
import type { LostFoundType, PetSpecies } from "@prisma/client";

import { auth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { lostFoundInputSchema } from "@/lib/validations/lost-found";
import { createLostFoundReport, getLostFoundReports } from "@/server/services/lost-found-service";

const TYPES = new Set(["LOST", "FOUND"]);
const SPECIES = new Set(["DOG", "CAT", "OTHER"]);

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");
  const species = searchParams.get("species");
  const district = searchParams.get("district");

  const reports = await getLostFoundReports({
    type: type && TYPES.has(type) ? (type as LostFoundType) : undefined,
    species: species && SPECIES.has(species) ? (species as PetSpecies) : undefined,
    district: district || undefined,
  });

  return NextResponse.json({ reports });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  // A stray script could otherwise flood the public board — cap new reports
  // per reporter well above what a real user would ever need in a day.
  const limit = await checkRateLimit(`lost-found:create:${session.user.id}`, {
    limit: 10,
    windowMs: 24 * 60 * 60 * 1000,
  });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds!);

  const body = await request.json().catch(() => null);
  const parsed = lostFoundInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form for errors", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { petName, breedName, color, address, district, rewardMnt, lastSeenAt, ...rest } = parsed.data;
  const report = await createLostFoundReport(session.user.id, {
    ...rest,
    petName: petName || null,
    breedName: breedName || null,
    color: color || null,
    address: address || null,
    district: district || null,
    rewardMnt: rewardMnt ?? null,
    lastSeenAt: new Date(`${lastSeenAt}T00:00:00Z`),
  });

  return NextResponse.json({ report }, { status: 201 });
});

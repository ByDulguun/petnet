import { Prisma } from "@prisma/client";
import { revalidateTag } from "next/cache";

import { prisma } from "@/lib/prisma";

export type ReviewEligibility =
  | { eligible: true }
  | { eligible: false; reason: "no_completed_appointment" | "already_reviewed" };

/** A review requires a completed appointment at this business, and only one
 * review per business per user (the schema's existing unique constraint) —
 * "one appointment earns you the right to review," not "one review per
 * visit," matching how most review platforms already work. */
export async function getReviewEligibility(
  userId: string,
  businessId: string,
): Promise<ReviewEligibility> {
  const [hasCompletedVisit, existingReview] = await Promise.all([
    prisma.appointment.findFirst({
      where: { userId, businessId, status: "COMPLETED" },
      select: { id: true },
    }),
    prisma.review.findUnique({
      where: { userId_businessId: { userId, businessId } },
      select: { id: true },
    }),
  ]);

  if (existingReview) return { eligible: false, reason: "already_reviewed" };
  if (!hasCompletedVisit) return { eligible: false, reason: "no_completed_appointment" };
  return { eligible: true };
}

export interface ReviewInput {
  rating: number;
  title?: string;
  body: string;
}

export type CreateReviewResult = { ok: true } | { ok: false; error: string; status: number };

export async function createReview(
  userId: string,
  businessSlug: string,
  input: ReviewInput,
): Promise<CreateReviewResult> {
  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
    select: { id: true, status: true, ownerId: true },
  });
  if (!business || business.status !== "ACTIVE") {
    return { ok: false, error: "Business not found", status: 404 };
  }
  // Defense in depth: booking creation already blocks an owner from
  // booking their own business (so this path shouldn't be reachable), but
  // never let a business's own owner post a review for it either way.
  if (business.ownerId === userId) {
    return { ok: false, error: "You can't review your own business", status: 403 };
  }

  const eligibility = await getReviewEligibility(userId, business.id);
  if (!eligibility.eligible) {
    return {
      ok: false,
      error:
        eligibility.reason === "already_reviewed"
          ? "You've already reviewed this business"
          : "You can review a business after a completed visit",
      status: 403,
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.review.create({
        data: {
          userId,
          businessId: business.id,
          rating: input.rating,
          title: input.title,
          body: input.body,
          isVerified: true, // always true here — the only path to creating a review requires a completed appointment
        },
      });

      const agg = await tx.review.aggregate({
        where: { businessId: business.id },
        _avg: { rating: true },
        _count: true,
      });

      await tx.business.update({
        where: { id: business.id },
        data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count },
      });
    });
  } catch (err) {
    // Race backstop: two near-simultaneous submissions both pass the
    // pre-check above, but the DB's own unique constraint only lets one
    // through — the loser lands here, not in application logic.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "You've already reviewed this business", status: 409 };
    }
    throw err;
  }

  revalidateTag("businesses");
  return { ok: true };
}

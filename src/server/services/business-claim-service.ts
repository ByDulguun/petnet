import { revalidateTag } from "next/cache";

import { geocodeAddress } from "@/lib/geocoding";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/server/services/notification-service";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "business";
  let slug = root;
  let n = 1;
  while (await prisma.business.findUnique({ where: { slug }, select: { id: true } })) {
    n += 1;
    slug = `${root}-${n}`;
  }
  return slug;
}

/** The business a user actively manages, if any — the single source of
 * truth for every business-portal authorization check. Never trust a URL
 * or client-supplied business id; always resolve it from the session user. */
export async function getOwnedBusiness(userId: string) {
  return prisma.business.findFirst({
    where: { ownerId: userId, status: "ACTIVE" },
  });
}

export async function getMyLatestClaim(userId: string) {
  return prisma.businessClaim.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      business: { select: { name: true, slug: true } },
      category: { select: { name: true } },
    },
  });
}

export interface ClaimInput {
  businessId?: string | null;
  categoryId: string;
  name: string;
  phone?: string;
  address?: string;
  district?: string;
  description?: string;
}

export type SubmitClaimResult =
  | { ok: true; claimId: string }
  | { ok: false; error: string; status: number };

export async function submitClaim(userId: string, input: ClaimInput): Promise<SubmitClaimResult> {
  const alreadyOwns = await getOwnedBusiness(userId);
  if (alreadyOwns) {
    return { ok: false, error: "You already manage a business on PetNet", status: 409 };
  }

  const existingPending = await prisma.businessClaim.findFirst({
    where: { userId, status: "PENDING" },
  });
  if (existingPending) {
    return { ok: false, error: "You already have a pending request", status: 409 };
  }

  if (input.businessId) {
    const target = await prisma.business.findUnique({ where: { id: input.businessId } });
    if (!target) return { ok: false, error: "Business not found", status: 404 };
  }

  const claim = await prisma.businessClaim.create({
    data: {
      userId,
      businessId: input.businessId || null,
      categoryId: input.categoryId,
      name: input.name,
      phone: input.phone || undefined,
      address: input.address || undefined,
      district: input.district || undefined,
      description: input.description || undefined,
    },
  });

  return { ok: true, claimId: claim.id };
}

export async function getPendingClaims() {
  return prisma.businessClaim.findMany({
    where: { status: "PENDING" },
    include: {
      user: { select: { name: true, email: true } },
      business: { select: { name: true, slug: true } },
      category: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export type ReviewClaimResult = { ok: true } | { ok: false; error: string; status: number };

export async function approveClaim(claimId: string): Promise<ReviewClaimResult> {
  const claim = await prisma.businessClaim.findUnique({ where: { id: claimId } });
  if (!claim || claim.status !== "PENDING") {
    return { ok: false, error: "Claim not found or already reviewed", status: 404 };
  }

  const slug = claim.businessId ? null : await uniqueSlug(claim.name);

  // Best-effort, outside the transaction (it's a network call — keep the
  // DB transaction short and free of I/O to external services). A newly
  // approved business ideally has real coordinates immediately, but this
  // is a background nicety, not the authoritative geocoding gate — that's
  // the profile-edit flow (updateBusinessProfile), which blocks on failure
  // instead of silently proceeding the way this does.
  let coords: { lat: number; lng: number } | null = null;
  if (!claim.businessId && (claim.address || claim.district)) {
    coords = await geocodeAddress({
      address: claim.address ?? undefined,
      district: claim.district ?? undefined,
    }).catch(() => null);
  }

  await prisma.$transaction(async (tx) => {
    if (claim.businessId) {
      await tx.business.update({
        where: { id: claim.businessId },
        data: { ownerId: claim.userId, status: "ACTIVE" },
      });
    } else {
      await tx.business.create({
        data: {
          slug: slug!,
          name: claim.name,
          ownerId: claim.userId,
          categoryId: claim.categoryId,
          phone: claim.phone,
          address: claim.address,
          district: claim.district,
          description: claim.description,
          status: "ACTIVE",
          latitude: coords?.lat,
          longitude: coords?.lng,
        },
      });
    }

    await tx.user.update({ where: { id: claim.userId }, data: { role: "BUSINESS_OWNER" } });
    await tx.businessClaim.update({ where: { id: claimId }, data: { status: "APPROVED" } });
  });

  await createNotification(claim.userId, {
    type: "SYSTEM",
    title: `"${claim.name}" was approved`,
    body: "You can now manage it from your Business Dashboard.",
    href: "/business/dashboard",
  });

  revalidateTag("businesses");

  return { ok: true };
}

export async function rejectClaim(claimId: string, note?: string): Promise<ReviewClaimResult> {
  const claim = await prisma.businessClaim.findUnique({ where: { id: claimId } });
  if (!claim || claim.status !== "PENDING") {
    return { ok: false, error: "Claim not found or already reviewed", status: 404 };
  }

  await prisma.businessClaim.update({
    where: { id: claimId },
    data: { status: "REJECTED", reviewNote: note },
  });

  await createNotification(claim.userId, {
    type: "SYSTEM",
    title: `Your request for "${claim.name}" wasn't approved`,
    body: note || undefined,
    href: "/business/join",
  });

  return { ok: true };
}

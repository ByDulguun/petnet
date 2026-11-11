// Adoption domain service. A listing always belongs to a shelter/rescue
// Business (the Prisma schema requires it — there's no "individual foster"
// path modeled), so every write here is scoped to a businessId taken from
// requireBusinessOwner() server-side, same ownership pattern as
// business-portal-service.ts. Applications are scoped to the applicant's
// userId the same way pet-service.ts scopes pets to an owner.

import type {
  AdoptionStatus,
  ApplicationStatus,
  PetGender,
  PetSpecies,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export interface AdoptionListingInput {
  petName: string;
  species: PetSpecies;
  gender: PetGender;
  breedId?: string | null;
  story?: string | null;
  goodWith: string[];
  feeMnt?: number | null;
}

const listingInclude = {
  pet: { include: { breed: true } },
  business: { select: { id: true, ownerId: true, name: true, slug: true, district: true, phone: true } },
  _count: { select: { applications: true } },
};

// ── public browse ───────────────────────────────────────────────────────────

export interface AdoptionListFilters {
  species?: PetSpecies;
  status?: AdoptionStatus;
}

export async function getAdoptionListings(filters: AdoptionListFilters = {}) {
  return prisma.adoptionListing.findMany({
    where: {
      status: filters.status ?? "AVAILABLE",
      pet: filters.species ? { species: filters.species } : undefined,
    },
    include: listingInclude,
    orderBy: { createdAt: "desc" },
    take: 60,
  });
}

export async function getAdoptionListingById(id: string) {
  return prisma.adoptionListing.findUnique({ where: { id }, include: listingInclude });
}

// ── business (shelter) management ───────────────────────────────────────────

export async function getAdoptionListingsForBusiness(businessId: string) {
  return prisma.adoptionListing.findMany({
    where: { businessId },
    include: listingInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getAdoptionListingForOwner(id: string, businessId: string) {
  const listing = await prisma.adoptionListing.findUnique({ where: { id }, include: listingInclude });
  if (!listing || listing.businessId !== businessId) return null;
  return listing;
}

export async function createAdoptionListing(
  businessId: string,
  ownerId: string,
  input: AdoptionListingInput,
) {
  return prisma.$transaction(async (tx) => {
    const pet = await tx.pet.create({
      data: {
        ownerId,
        name: input.petName,
        species: input.species,
        gender: input.gender,
        breedId: input.breedId || null,
        isPublic: true,
      },
    });
    return tx.adoptionListing.create({
      data: {
        businessId,
        petId: pet.id,
        story: input.story || null,
        goodWith: input.goodWith,
        feeMnt: input.feeMnt ?? null,
      },
      include: listingInclude,
    });
  });
}

export async function updateAdoptionListing(
  id: string,
  businessId: string,
  input: AdoptionListingInput,
) {
  const existing = await prisma.adoptionListing.findUnique({
    where: { id },
    select: { businessId: true, petId: true },
  });
  if (!existing || existing.businessId !== businessId) return null;

  return prisma.$transaction(async (tx) => {
    await tx.pet.update({
      where: { id: existing.petId },
      data: {
        name: input.petName,
        species: input.species,
        gender: input.gender,
        breedId: input.breedId || null,
      },
    });
    return tx.adoptionListing.update({
      where: { id },
      data: {
        story: input.story || null,
        goodWith: input.goodWith,
        feeMnt: input.feeMnt ?? null,
      },
      include: listingInclude,
    });
  });
}

export async function updateAdoptionListingStatus(
  id: string,
  businessId: string,
  status: AdoptionStatus,
) {
  const existing = await prisma.adoptionListing.findUnique({ where: { id }, select: { businessId: true } });
  if (!existing || existing.businessId !== businessId) return null;
  return prisma.adoptionListing.update({ where: { id }, data: { status } });
}

export async function deleteAdoptionListing(id: string, businessId: string): Promise<boolean> {
  const existing = await prisma.adoptionListing.findUnique({
    where: { id },
    select: { businessId: true, petId: true },
  });
  if (!existing || existing.businessId !== businessId) return false;
  // The listing (and its applications) cascade away with the pet — see the
  // onDelete: Cascade relations on AdoptionListing.pet / AdoptionApplication.listing.
  await prisma.pet.delete({ where: { id: existing.petId } });
  return true;
}

// ── applications ─────────────────────────────────────────────────────────────

export async function getApplicationForUser(listingId: string, applicantId: string) {
  return prisma.adoptionApplication.findUnique({
    where: { listingId_applicantId: { listingId, applicantId } },
  });
}

export type CreateApplicationResult =
  | { ok: true; application: Awaited<ReturnType<typeof prisma.adoptionApplication.create>> }
  | { ok: false; reason: "not_found" | "not_available" | "already_applied" };

export async function createApplication(
  listingId: string,
  applicantId: string,
  data: { message: string; homeType?: string | null; hasOtherPets: boolean },
): Promise<CreateApplicationResult> {
  const listing = await prisma.adoptionListing.findUnique({
    where: { id: listingId },
    select: { status: true },
  });
  if (!listing) return { ok: false, reason: "not_found" };
  if (listing.status === "ADOPTED") return { ok: false, reason: "not_available" };

  const existing = await getApplicationForUser(listingId, applicantId);
  if (existing) return { ok: false, reason: "already_applied" };

  const application = await prisma.adoptionApplication.create({
    data: { listingId, applicantId, ...data },
  });
  return { ok: true, application };
}

export async function withdrawApplication(listingId: string, applicantId: string): Promise<boolean> {
  const existing = await getApplicationForUser(listingId, applicantId);
  if (!existing) return false;
  await prisma.adoptionApplication.delete({ where: { id: existing.id } });
  return true;
}

export async function getApplicationsForListing(listingId: string, businessId: string) {
  const listing = await prisma.adoptionListing.findUnique({
    where: { id: listingId },
    select: { businessId: true },
  });
  if (!listing || listing.businessId !== businessId) return null;

  return prisma.adoptionApplication.findMany({
    where: { listingId },
    include: { applicant: { select: { name: true, email: true, phone: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export type UpdateApplicationResult =
  | { ok: true }
  | { ok: false; reason: "not_found" };

export async function updateApplicationStatus(
  applicationId: string,
  businessId: string,
  status: ApplicationStatus,
): Promise<UpdateApplicationResult> {
  const application = await prisma.adoptionApplication.findUnique({
    where: { id: applicationId },
    select: { listingId: true, listing: { select: { businessId: true } } },
  });
  if (!application || application.listing.businessId !== businessId) {
    return { ok: false, reason: "not_found" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.adoptionApplication.update({ where: { id: applicationId }, data: { status } });

    if (status === "APPROVED") {
      // A pet only goes home once — close the listing and stand down every
      // other still-open application for it in the same transaction.
      await tx.adoptionListing.update({ where: { id: application.listingId }, data: { status: "ADOPTED" } });
      await tx.adoptionApplication.updateMany({
        where: {
          listingId: application.listingId,
          id: { not: applicationId },
          status: { in: ["SUBMITTED", "REVIEWING"] },
        },
        data: { status: "REJECTED" },
      });
    }
  });

  return { ok: true };
}

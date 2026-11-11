// Breed encyclopedia service. Unlike every other module built so far, a
// Breed has no owner at all — it's curated reference content, so writes
// are gated to admins (checked by the caller, same inline role re-check
// every other admin route already uses) rather than any signed-in user.

import type { PetSpecies } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function getBreeds(species?: PetSpecies) {
  return prisma.breed.findMany({
    where: { species },
    select: {
      id: true,
      slug: true,
      name: true,
      nameMn: true,
      species: true,
      summary: true,
      coverImage: true,
      temperament: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function getBreedBySlug(slug: string) {
  return prisma.breed.findUnique({
    where: { slug },
    include: { images: { orderBy: { order: "asc" } } },
  });
}

export async function getAllBreedsForAdmin() {
  return prisma.breed.findMany({
    select: { id: true, slug: true, name: true, species: true, coverImage: true },
    orderBy: { name: "asc" },
  });
}

export async function getBreedById(id: string) {
  return prisma.breed.findUnique({ where: { id } });
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || "breed";
  let slug = root;
  let n = 1;
  for (;;) {
    const existing = await prisma.breed.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || existing.id === excludeId) return slug;
    n += 1;
    slug = `${root}-${n}`;
  }
}

export interface BreedWriteInput {
  name: string;
  nameMn?: string | null;
  species: PetSpecies;
  summary: string;
  history?: string | null;
  temperament: string[];
  exerciseNeeds?: number | null;
  groomingNeeds?: number | null;
  trainability?: number | null;
  friendliness?: number | null;
  sheddingLevel?: number | null;
  nutrition?: string | null;
  healthOverview?: string | null;
  commonDiseases: string[];
  lifeExpectancy?: string | null;
  weightRange?: string | null;
  heightRange?: string | null;
  pros: string[];
  cons: string[];
  coverImage?: string | null;
}

export async function createBreed(input: BreedWriteInput) {
  const slug = await uniqueSlug(input.name);
  return prisma.breed.create({ data: { ...input, slug } });
}

export async function updateBreed(id: string, input: BreedWriteInput) {
  const existing = await prisma.breed.findUnique({ where: { id }, select: { name: true, slug: true } });
  if (!existing) return null;
  const slug = input.name === existing.name ? existing.slug : await uniqueSlug(input.name, id);
  return prisma.breed.update({ where: { id }, data: { ...input, slug } });
}

export async function deleteBreed(id: string): Promise<boolean> {
  const existing = await prisma.breed.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return false;
  await prisma.breed.delete({ where: { id } });
  return true;
}

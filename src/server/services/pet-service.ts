// Pet domain service. Every function is scoped to a userId taken from the
// session server-side — never a client-supplied value — so ownership can't
// be spoofed by passing a different id in a request body.

import type { PetGender, PetSpecies } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export interface PetWriteInput {
  name: string;
  species: PetSpecies;
  gender: PetGender;
  breedId?: string | null;
  birthday?: Date | null;
  avatarUrl?: string | null;
}

export async function getPetsForUser(userId: string) {
  return prisma.pet.findMany({
    where: { ownerId: userId },
    include: { breed: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getPetById(id: string, userId: string) {
  const pet = await prisma.pet.findUnique({ where: { id }, include: { breed: true } });
  if (!pet || pet.ownerId !== userId) return null;
  return pet;
}

export async function createPet(userId: string, data: PetWriteInput) {
  return prisma.pet.create({ data: { ...data, ownerId: userId } });
}

export async function updatePet(id: string, userId: string, data: PetWriteInput) {
  const existing = await prisma.pet.findUnique({ where: { id }, select: { ownerId: true } });
  if (!existing || existing.ownerId !== userId) return null;
  return prisma.pet.update({ where: { id }, data });
}

export async function deletePet(id: string, userId: string): Promise<boolean> {
  const existing = await prisma.pet.findUnique({ where: { id }, select: { ownerId: true } });
  if (!existing || existing.ownerId !== userId) return false;
  await prisma.pet.delete({ where: { id } });
  return true;
}

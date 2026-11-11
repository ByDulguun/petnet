// Lost & Found domain service. Reports are publicly readable (that's the
// entire point — a wider audience means a better chance of a reunion) but
// every write is scoped to the reporter's userId taken from the session
// server-side, mirroring pet-service.ts's ownership-check pattern.

import type { Image, LostFoundStatus, LostFoundType, PetSpecies } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const MAX_LOST_FOUND_IMAGES = 4;

export interface LostFoundWriteInput {
  type: LostFoundType;
  petName?: string | null;
  species: PetSpecies;
  breedName?: string | null;
  color?: string | null;
  description: string;
  lastSeenAt: Date;
  address?: string | null;
  district?: string | null;
  rewardMnt?: number | null;
  phone: string;
}

export interface LostFoundListFilters {
  type?: LostFoundType;
  species?: PetSpecies;
  district?: string;
  status?: LostFoundStatus;
}

const reportInclude = {
  images: { orderBy: { order: "asc" as const } },
};

export async function getLostFoundReports(filters: LostFoundListFilters = {}) {
  return prisma.lostFoundReport.findMany({
    where: {
      status: filters.status ?? "OPEN",
      type: filters.type,
      species: filters.species,
      district: filters.district,
    },
    include: { images: { orderBy: { order: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 60,
  });
}

export async function getLostFoundReportById(id: string) {
  return prisma.lostFoundReport.findUnique({ where: { id }, include: reportInclude });
}

export async function getLostFoundReportForOwner(id: string, userId: string) {
  const report = await prisma.lostFoundReport.findUnique({ where: { id }, include: reportInclude });
  if (!report || report.reporterId !== userId) return null;
  return report;
}

export async function createLostFoundReport(userId: string, data: LostFoundWriteInput) {
  return prisma.lostFoundReport.create({ data: { ...data, reporterId: userId } });
}

export async function updateLostFoundReport(id: string, userId: string, data: LostFoundWriteInput) {
  const existing = await prisma.lostFoundReport.findUnique({ where: { id }, select: { reporterId: true } });
  if (!existing || existing.reporterId !== userId) return null;
  return prisma.lostFoundReport.update({ where: { id }, data });
}

export async function updateLostFoundStatus(id: string, userId: string, status: LostFoundStatus) {
  const existing = await prisma.lostFoundReport.findUnique({ where: { id }, select: { reporterId: true } });
  if (!existing || existing.reporterId !== userId) return null;
  return prisma.lostFoundReport.update({ where: { id }, data: { status } });
}

export async function deleteLostFoundReport(id: string, userId: string): Promise<boolean> {
  const existing = await prisma.lostFoundReport.findUnique({ where: { id }, select: { reporterId: true } });
  if (!existing || existing.reporterId !== userId) return false;
  await prisma.lostFoundReport.delete({ where: { id } });
  return true;
}

export type AddLostFoundImageResult =
  | { ok: true; image: Image }
  | { ok: false; reason: "not_found" | "limit_reached" };

export async function addLostFoundImage(
  reportId: string,
  userId: string,
  url: string,
  publicId?: string,
): Promise<AddLostFoundImageResult> {
  const report = await prisma.lostFoundReport.findUnique({
    where: { id: reportId },
    select: { reporterId: true, _count: { select: { images: true } } },
  });
  if (!report || report.reporterId !== userId) return { ok: false, reason: "not_found" };
  if (report._count.images >= MAX_LOST_FOUND_IMAGES) return { ok: false, reason: "limit_reached" };

  const image = await prisma.image.create({
    data: { url, publicId, lostFoundId: reportId, order: report._count.images },
  });
  return { ok: true, image };
}

export async function deleteLostFoundImage(imageId: string, userId: string): Promise<boolean> {
  const image = await prisma.image.findUnique({
    where: { id: imageId },
    select: { lostFound: { select: { reporterId: true } } },
  });
  if (!image?.lostFound || image.lostFound.reporterId !== userId) return false;
  await prisma.image.delete({ where: { id: imageId } });
  return true;
}

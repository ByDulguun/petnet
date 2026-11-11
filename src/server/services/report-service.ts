import type { ReportReason } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export interface ReportSubmission {
  targetType: "business" | "review";
  targetId: string;
  reason: ReportReason;
  details?: string;
}

export type SubmitReportResult = { ok: true } | { ok: false; error: string; status: number };

export async function submitReport(
  userId: string,
  input: ReportSubmission,
): Promise<SubmitReportResult> {
  const targetWhere =
    input.targetType === "business" ? { businessId: input.targetId } : { reviewId: input.targetId };

  // Duplicate-abuse guard: one open report per user per target, not a hard
  // one-ever cap — a resolved/dismissed report doesn't block a future
  // genuine one about the same thing.
  const existing = await prisma.report.findFirst({
    where: { reporterId: userId, status: { in: ["OPEN", "REVIEWING"] }, ...targetWhere },
    select: { id: true },
  });
  if (existing) {
    return { ok: false, error: "You've already reported this — we'll review it soon", status: 409 };
  }

  if (input.targetType === "business") {
    const business = await prisma.business.findUnique({
      where: { id: input.targetId },
      select: { id: true },
    });
    if (!business) return { ok: false, error: "Business not found", status: 404 };
  } else {
    const review = await prisma.review.findUnique({
      where: { id: input.targetId },
      select: { id: true },
    });
    if (!review) return { ok: false, error: "Review not found", status: 404 };
  }

  await prisma.report.create({
    data: {
      reporterId: userId,
      reason: input.reason,
      details: input.details,
      ...targetWhere,
    },
  });

  return { ok: true };
}

export async function getOpenReports() {
  return prisma.report.findMany({
    where: { status: { in: ["OPEN", "REVIEWING"] } },
    include: {
      reporter: { select: { name: true, email: true } },
      business: { select: { name: true, slug: true } },
      review: {
        select: { body: true, rating: true, business: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export type ReviewReportResult = { ok: true } | { ok: false; error: string; status: number };

export async function reviewReport(
  id: string,
  action: "resolve" | "dismiss",
): Promise<ReviewReportResult> {
  const report = await prisma.report.findUnique({ where: { id }, select: { status: true } });
  if (!report || (report.status !== "OPEN" && report.status !== "REVIEWING")) {
    return { ok: false, error: "Report not found or already reviewed", status: 404 };
  }

  await prisma.report.update({
    where: { id },
    data: {
      status: action === "resolve" ? "RESOLVED" : "DISMISSED",
      resolvedAt: new Date(),
    },
  });

  return { ok: true };
}

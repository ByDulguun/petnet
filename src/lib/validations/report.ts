import { z } from "zod";

// Only targets the current product actually has: businesses and reviews.
// Report.postId/commentId exist in the schema for a community feature that
// isn't built yet — no route accepts those targets.
export const reportSchema = z.object({
  targetType: z.enum(["business", "review"]),
  targetId: z.string().min(1),
  reason: z.enum(["SPAM", "OFFENSIVE", "FAKE", "OTHER"]),
  details: z.string().trim().max(1000).optional(),
});

export type ReportInput = z.infer<typeof reportSchema>;

export const reportReviewSchema = z.object({
  action: z.enum(["resolve", "dismiss"]),
});

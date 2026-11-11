import { z } from "zod";

export const postInputSchema = z.object({
  body: z.string().trim().max(2000).optional().or(z.literal("")),
  petId: z.string().trim().max(60).optional().or(z.literal("")),
});

export type PostInput = z.infer<typeof postInputSchema>;

export const commentInputSchema = z.object({
  body: z.string().trim().min(1, "Please write something").max(1000),
  parentId: z.string().trim().max(60).optional().or(z.literal("")),
});

export type CommentInput = z.infer<typeof commentInputSchema>;

import { z } from "zod";

export const lostFoundInputSchema = z.object({
  type: z.enum(["LOST", "FOUND"]),
  petName: z.string().trim().max(60).optional().or(z.literal("")),
  species: z.enum(["DOG", "CAT", "OTHER"]),
  breedName: z.string().trim().max(60).optional().or(z.literal("")),
  color: z.string().trim().max(60).optional().or(z.literal("")),
  description: z.string().trim().min(10, "Please add a bit more detail").max(2000),
  lastSeenAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  district: z.string().trim().max(60).optional().or(z.literal("")),
  rewardMnt: z.number().int().min(0).max(100_000_000).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s-]{8,15}$/, "Please enter a valid phone number"),
});

export type LostFoundInput = z.infer<typeof lostFoundInputSchema>;

export const lostFoundStatusSchema = z.object({
  status: z.enum(["OPEN", "REUNITED", "CLOSED"]),
});

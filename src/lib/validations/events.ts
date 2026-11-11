import { z } from "zod";

export const EVENT_TYPES = [
  "MEETUP",
  "DOG_SHOW",
  "TRAINING_CAMP",
  "VACCINATION_DAY",
  "ADOPTION_DAY",
  "OTHER",
] as const;

export const eventInputSchema = z
  .object({
    title: z.string().trim().min(2, "Please enter a title").max(120),
    description: z.string().trim().min(10, "Please add a bit more detail").max(2000),
    type: z.enum(EVENT_TYPES),
    startsAt: z.string().min(1, "Please choose a start time"),
    endsAt: z.string().optional().or(z.literal("")),
    venue: z.string().trim().max(120).optional().or(z.literal("")),
    address: z.string().trim().max(200).optional().or(z.literal("")),
    capacity: z.number().int().min(1).max(100_000).optional(),
    priceMnt: z.number().int().min(0).max(100_000_000).optional(),
    asBusiness: z.boolean().optional(),
  })
  .refine((data) => !data.endsAt || data.endsAt >= data.startsAt, {
    message: "End time can't be before the start time",
    path: ["endsAt"],
  });

export type EventInput = z.infer<typeof eventInputSchema>;

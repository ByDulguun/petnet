import { z } from "zod";

export const petInputSchema = z.object({
  name: z.string().trim().min(1, "Please enter a name").max(60),
  species: z.enum(["DOG", "CAT", "OTHER"]),
  gender: z.enum(["MALE", "FEMALE", "UNKNOWN"]),
  breedId: z.string().trim().max(60).optional().or(z.literal("")),
  birthday: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
    .optional()
    .or(z.literal("")),
  avatarUrl: z.string().url().max(500).optional().or(z.literal("")),
});

export type PetInput = z.infer<typeof petInputSchema>;

import { z } from "zod";

export const GOOD_WITH_OPTIONS = ["kids", "cats", "dogs"] as const;

export const adoptionListingSchema = z.object({
  petName: z.string().trim().min(1, "Please enter a name").max(60),
  species: z.enum(["DOG", "CAT", "OTHER"]),
  gender: z.enum(["MALE", "FEMALE", "UNKNOWN"]),
  breedId: z.string().trim().max(60).optional().or(z.literal("")),
  story: z.string().trim().max(2000).optional().or(z.literal("")),
  goodWith: z.array(z.enum(GOOD_WITH_OPTIONS)),
  feeMnt: z.number().int().min(0).max(100_000_000).optional(),
});

export type AdoptionListingInput = z.infer<typeof adoptionListingSchema>;

export const adoptionListingStatusSchema = z.object({
  status: z.enum(["AVAILABLE", "PENDING", "ADOPTED"]),
});

export const adoptionApplicationSchema = z.object({
  message: z.string().trim().min(10, "Please add a bit more detail").max(1000),
  homeType: z.enum(["apartment", "house", "yard"]).optional().or(z.literal("")),
  hasOtherPets: z.boolean(),
});

export type AdoptionApplicationInput = z.infer<typeof adoptionApplicationSchema>;

export const applicationStatusSchema = z.object({
  status: z.enum(["REVIEWING", "APPROVED", "REJECTED"]),
});

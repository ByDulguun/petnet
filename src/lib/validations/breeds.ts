import { z } from "zod";

const csvList = z
  .string()
  .transform((v) =>
    v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );

const rating = z.number().int().min(1).max(5).optional();

export const breedInputSchema = z.object({
  name: z.string().trim().min(1, "Please enter a name").max(80),
  nameMn: z.string().trim().max(80).optional().or(z.literal("")),
  species: z.enum(["DOG", "CAT", "OTHER"]),
  summary: z.string().trim().min(10, "Please add a short summary").max(500),
  history: z.string().trim().max(3000).optional().or(z.literal("")),
  temperament: csvList,
  exerciseNeeds: rating,
  groomingNeeds: rating,
  trainability: rating,
  friendliness: rating,
  sheddingLevel: rating,
  nutrition: z.string().trim().max(2000).optional().or(z.literal("")),
  healthOverview: z.string().trim().max(2000).optional().or(z.literal("")),
  commonDiseases: csvList,
  lifeExpectancy: z.string().trim().max(40).optional().or(z.literal("")),
  weightRange: z.string().trim().max(40).optional().or(z.literal("")),
  heightRange: z.string().trim().max(40).optional().or(z.literal("")),
  pros: csvList,
  cons: csvList,
});

export type BreedInput = z.infer<typeof breedInputSchema>;

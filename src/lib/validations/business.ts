import { z } from "zod";

export const businessClaimSchema = z.object({
  businessId: z.string().min(1).optional(),
  categoryId: z.string().min(1, "Please choose a category"),
  name: z.string().trim().min(2, "Please enter a business name").max(120),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s-]{8,15}$/, "Please enter a valid phone number")
    .optional()
    .or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  district: z.string().trim().max(60).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type BusinessClaimInput = z.infer<typeof businessClaimSchema>;

export const claimReviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
  note: z.string().trim().max(500).optional(),
});

export const appointmentActionSchema = z.object({
  action: z.enum(["confirm", "cancel", "complete"]),
});

// Plain (non-coerced) number fields: the form converts "" -> undefined via
// register(..., { setValueAs }) before this ever runs, so the schema's input
// and output types stay identical — coercing here instead would make
// useForm<BusinessServiceInput> fight zodResolver's inferred input type.
export const businessServiceSchema = z.object({
  name: z.string().trim().min(1, "Please enter a service name").max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  priceMnt: z.number().int().min(0).max(100_000_000).optional(),
  durationMin: z.number().int().min(5).max(480).optional(),
  isActive: z.boolean(),
});

export type BusinessServiceInput = z.infer<typeof businessServiceSchema>;

const hourRowSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    isOpen: z.boolean(),
    is24h: z.boolean(),
    opensAt: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
    closesAt: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
  })
  .refine((h) => h.is24h || !h.isOpen || (h.opensAt && h.closesAt), {
    message: "Set both an opening and closing time",
  });

export const businessHoursSchema = z.object({
  hours: z.array(hourRowSchema).length(7),
});

export type BusinessHoursInput = z.infer<typeof businessHoursSchema>;

// Deliberately excludes status/isVerified/ownerId/slug — those aren't
// editable by the business owner, no matter what a client sends.
export const businessProfileSchema = z.object({
  name: z.string().trim().min(2, "Please enter a business name").max(120),
  categoryId: z.string().min(1, "Please choose a category"),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s-]{8,15}$/, "Please enter a valid phone number")
    .optional()
    .or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  district: z.string().trim().max(60).optional().or(z.literal("")),
  website: z.string().trim().max(200).optional().or(z.literal("")),
  facebook: z.string().trim().max(200).optional().or(z.literal("")),
  instagram: z.string().trim().max(200).optional().or(z.literal("")),
  tiktok: z.string().trim().max(200).optional().or(z.literal("")),
});

export type BusinessProfileInput = z.infer<typeof businessProfileSchema>;

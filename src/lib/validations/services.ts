import { z } from "zod";

/** GET /api/businesses — query params (all optional). */
export const businessSearchSchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().max(60).optional(),
  district: z.string().trim().max(60).optional(),
  openNow: z.coerce.boolean().optional(),
  open24h: z.coerce.boolean().optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  amenities: z
    .string()
    .transform((s) => s.split(",").filter(Boolean))
    .pipe(z.array(z.string().max(60)).max(12))
    .optional(),
  priceLevels: z
    .string()
    .transform((s) => s.split(",").filter(Boolean).map(Number))
    .pipe(z.array(z.number().int().min(1).max(4)).max(4))
    .optional(),
  verifiedOnly: z.coerce.boolean().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().max(100).optional(),
  sort: z.enum(["relevance", "rating", "reviews", "distance", "name"]).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type BusinessSearchInput = z.infer<typeof businessSearchSchema>;

export const autocompleteSchema = z.object({
  q: z.string().trim().min(1).max(80),
});

export const slotsQuerySchema = z.object({
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
});

export const reviewSortSchema = z.object({
  sort: z.enum(["newest", "highest", "lowest", "helpful"]).default("newest"),
});

/** POST /api/bookings — requires an authenticated session; the booking is
 * always created for the signed-in user, never a client-supplied id. */
export const bookingRequestSchema = z.object({
  businessSlug: z.string().min(1),
  serviceId: z.string().min(1),
  petId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Expected HH:MM"),
  note: z.string().trim().max(500).optional(),
});

export type BookingRequest = z.infer<typeof bookingRequestSchema>;

/** POST /api/businesses/[slug]/reviews (requires auth — Module 2) */
export const reviewCreateSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().min(20, "Reviews need at least 20 characters").max(2000),
});

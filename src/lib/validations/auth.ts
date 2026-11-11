import { z } from "zod";

/** Used by the Credentials provider's authorize() — kept lenient since the
 * strength check already happened at registration. */
export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.string().trim().toLowerCase().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s-]{8,15}$/, "Please enter a valid phone number")
    .optional()
    .or(z.literal("")),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email"),
  password: z.string().min(1, "Please enter your password"),
});

export type LoginInput = z.infer<typeof loginSchema>;

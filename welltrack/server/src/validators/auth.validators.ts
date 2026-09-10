import { z } from "zod";

export const registerSchema = z.object({
  email: z.email("Invalid email address").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be 72 characters or fewer")
    .regex(/[A-Za-z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  displayName: z
    .string()
    .trim()
    .min(1, "Display name is required")
    .max(100, "Display name must be 100 characters or fewer"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

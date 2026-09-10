import { z } from "zod";

export const createHabitSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or fewer"),
  trackingType: z.enum(["boolean", "numeric", "duration"]),
  unit: z.string().trim().max(50, "Unit must be 50 characters or fewer").optional(),
});

export type CreateHabitInput = z.infer<typeof createHabitSchema>;

import { z } from "zod";

export const createSymptomSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or fewer"),
  category: z
    .string()
    .trim()
    .min(1, "Category is required")
    .max(100, "Category must be 100 characters or fewer"),
});

export type CreateSymptomInput = z.infer<typeof createSymptomSchema>;

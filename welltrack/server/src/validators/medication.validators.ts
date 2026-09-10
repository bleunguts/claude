import { z } from "zod";

export const createMedicationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(200, "Name must be 200 characters or fewer"),
  dosage: z.string().trim().max(200, "Dosage must be 200 characters or fewer").optional(),
  frequency: z.string().trim().max(200, "Frequency must be 200 characters or fewer").optional(),
});

export type CreateMedicationInput = z.infer<typeof createMedicationSchema>;

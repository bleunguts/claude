import { z } from "zod";

export const createMedicationLogSchema = z.object({
  medicationId: z.uuid("medicationId must be a valid UUID"),
  taken: z.boolean("taken is required"),
  takenAt: z.iso
    .datetime({ offset: true, message: "takenAt must be an ISO 8601 date-time" })
    .optional(),
  notes: z.string().trim().max(1000, "Notes must be 1000 characters or fewer").optional(),
});

export type CreateMedicationLogInput = z.infer<typeof createMedicationLogSchema>;

export const updateMedicationLogSchema = createMedicationLogSchema.partial();

export type UpdateMedicationLogInput = z.infer<typeof updateMedicationLogSchema>;

export const medicationLogQuerySchema = z.object({
  startDate: z.iso.datetime({ offset: true }).optional(),
  endDate: z.iso.datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type MedicationLogQuery = z.infer<typeof medicationLogQuerySchema>;

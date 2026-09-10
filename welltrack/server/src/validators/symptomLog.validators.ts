import { z } from "zod";

export const createSymptomLogSchema = z.object({
  symptomId: z.uuid("symptomId must be a valid UUID"),
  severity: z
    .int("Severity must be an integer")
    .min(1)
    .max(10, "Severity must be between 1 and 10"),
  notes: z.string().trim().max(1000, "Notes must be 1000 characters or fewer").optional(),
  loggedAt: z.iso
    .datetime({ offset: true, message: "loggedAt must be an ISO 8601 date-time" })
    .optional(),
});

export type CreateSymptomLogInput = z.infer<typeof createSymptomLogSchema>;

export const updateSymptomLogSchema = createSymptomLogSchema.partial();

export type UpdateSymptomLogInput = z.infer<typeof updateSymptomLogSchema>;

export const symptomLogQuerySchema = z.object({
  startDate: z.iso.datetime({ offset: true }).optional(),
  endDate: z.iso.datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type SymptomLogQuery = z.infer<typeof symptomLogQuerySchema>;

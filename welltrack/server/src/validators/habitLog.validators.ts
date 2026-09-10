import { z } from "zod";

// Note: this schema intentionally does NOT enforce "exactly one value field must be set for
// the habit's trackingType" — that requires knowing the parent habit's trackingType, which
// isn't available at body-parse time. See validateHabitLogValue in habitLog.service.ts.
export const createHabitLogSchema = z.object({
  habitId: z.uuid("habitId must be a valid UUID"),
  valueBoolean: z.boolean().optional(),
  valueNumeric: z.number().optional(),
  valueDuration: z.int("valueDuration must be an integer").nonnegative().optional(),
  notes: z.string().trim().max(1000, "Notes must be 1000 characters or fewer").optional(),
  loggedAt: z.iso
    .datetime({ offset: true, message: "loggedAt must be an ISO 8601 date-time" })
    .optional(),
});

export type CreateHabitLogInput = z.infer<typeof createHabitLogSchema>;

export const updateHabitLogSchema = createHabitLogSchema.partial();

export type UpdateHabitLogInput = z.infer<typeof updateHabitLogSchema>;

export const habitLogQuerySchema = z.object({
  startDate: z.iso.datetime({ offset: true }).optional(),
  endDate: z.iso.datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type HabitLogQuery = z.infer<typeof habitLogQuerySchema>;

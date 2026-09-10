import { z } from "zod";

const scaleOf5 = (label: string) =>
  z
    .int(`${label} must be an integer`)
    .min(1, `${label} must be between 1 and 5`)
    .max(5, `${label} must be between 1 and 5`);

export const createMoodLogSchema = z.object({
  moodScore: scaleOf5("moodScore"),
  energyLevel: scaleOf5("energyLevel").optional(),
  stressLevel: scaleOf5("stressLevel").optional(),
  notes: z.string().trim().max(1000, "Notes must be 1000 characters or fewer").optional(),
  loggedAt: z.iso
    .datetime({ offset: true, message: "loggedAt must be an ISO 8601 date-time" })
    .optional(),
});

export type CreateMoodLogInput = z.infer<typeof createMoodLogSchema>;

export const updateMoodLogSchema = createMoodLogSchema.partial();

export type UpdateMoodLogInput = z.infer<typeof updateMoodLogSchema>;

export const moodLogQuerySchema = z.object({
  startDate: z.iso.datetime({ offset: true }).optional(),
  endDate: z.iso.datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type MoodLogQuery = z.infer<typeof moodLogQuerySchema>;

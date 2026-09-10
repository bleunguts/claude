import type { PrismaClient } from "../generated/prisma/client.js";
import type { TrackingType } from "../generated/prisma/enums.js";
import { prisma as defaultPrisma } from "../lib/prisma.js";
import { requireOwned } from "../lib/ownership.js";
import { BadRequestError } from "../lib/errors.js";
import { getVisibleHabitOrThrow } from "./habit.service.js";
import type {
  CreateHabitLogInput,
  HabitLogQuery,
  UpdateHabitLogInput,
} from "../validators/habitLog.validators.js";

export interface HabitLogListResult {
  items: unknown[];
  total: number;
}

export interface HabitLogValue {
  valueBoolean?: boolean;
  valueNumeric?: number;
  valueDuration?: number;
}

/**
 * Enforces that exactly the value field matching a habit's trackingType is set, and that the
 * other two value fields are left undefined. Throws BadRequestError otherwise.
 */
export function validateHabitLogValue(trackingType: TrackingType, input: HabitLogValue): void {
  const fieldForType: Record<TrackingType, keyof HabitLogValue> = {
    boolean: "valueBoolean",
    numeric: "valueNumeric",
    duration: "valueDuration",
  };

  const requiredField = fieldForType[trackingType];
  const allFields: (keyof HabitLogValue)[] = ["valueBoolean", "valueNumeric", "valueDuration"];

  if (input[requiredField] === undefined) {
    throw new BadRequestError(
      `${requiredField} is required for a ${trackingType} habit`,
      "INVALID_HABIT_LOG_VALUE",
    );
  }

  const wrongFieldsSet = allFields.filter(
    (field) => field !== requiredField && input[field] !== undefined,
  );

  if (wrongFieldsSet.length > 0) {
    throw new BadRequestError(
      `Only ${requiredField} may be set for a ${trackingType} habit`,
      "INVALID_HABIT_LOG_VALUE",
    );
  }
}

const DEFAULT_PAGE_SIZE = 50;

export async function listHabitLogs(
  userId: string,
  query: HabitLogQuery,
  client: PrismaClient = defaultPrisma,
): Promise<HabitLogListResult> {
  const where = {
    userId,
    ...((query.startDate ?? query.endDate)
      ? {
          loggedAt: {
            ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
            ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
          },
        }
      : {}),
  };

  const take = query.limit ?? DEFAULT_PAGE_SIZE;
  const skip = query.offset ?? 0;

  const [items, total] = await Promise.all([
    client.habitLog.findMany({ where, orderBy: { loggedAt: "desc" }, take, skip }),
    client.habitLog.count({ where }),
  ]);

  return { items, total };
}

export async function createHabitLog(
  userId: string,
  input: CreateHabitLogInput,
  client: PrismaClient = defaultPrisma,
) {
  const habit = await getVisibleHabitOrThrow(input.habitId, userId, client);

  validateHabitLogValue(habit.trackingType, {
    valueBoolean: input.valueBoolean,
    valueNumeric: input.valueNumeric,
    valueDuration: input.valueDuration,
  });

  return client.habitLog.create({
    data: {
      userId,
      habitId: input.habitId,
      valueBoolean: input.valueBoolean,
      valueNumeric: input.valueNumeric,
      valueDuration: input.valueDuration,
      notes: input.notes,
      loggedAt: input.loggedAt ? new Date(input.loggedAt) : new Date(),
    },
  });
}

export async function updateHabitLog(
  userId: string,
  id: string,
  input: UpdateHabitLogInput,
  client: PrismaClient = defaultPrisma,
) {
  const existing = requireOwned(await client.habitLog.findUnique({ where: { id } }), userId);

  // habitId is not changeable via update; only the fields below may be updated.
  const hasValueField =
    input.valueBoolean !== undefined ||
    input.valueNumeric !== undefined ||
    input.valueDuration !== undefined;

  if (hasValueField) {
    const habit = await getVisibleHabitOrThrow(existing.habitId, userId, client);
    validateHabitLogValue(habit.trackingType, {
      valueBoolean:
        input.valueBoolean !== undefined
          ? input.valueBoolean
          : (existing.valueBoolean ?? undefined),
      valueNumeric:
        input.valueNumeric !== undefined
          ? input.valueNumeric
          : (existing.valueNumeric ?? undefined),
      valueDuration:
        input.valueDuration !== undefined
          ? input.valueDuration
          : (existing.valueDuration ?? undefined),
    });
  }

  return client.habitLog.update({
    where: { id: existing.id },
    data: {
      ...(input.valueBoolean !== undefined && { valueBoolean: input.valueBoolean }),
      ...(input.valueNumeric !== undefined && { valueNumeric: input.valueNumeric }),
      ...(input.valueDuration !== undefined && { valueDuration: input.valueDuration }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.loggedAt !== undefined && { loggedAt: new Date(input.loggedAt) }),
    },
  });
}

export async function deleteHabitLog(
  userId: string,
  id: string,
  client: PrismaClient = defaultPrisma,
): Promise<void> {
  const existing = requireOwned(await client.habitLog.findUnique({ where: { id } }), userId);
  await client.habitLog.delete({ where: { id: existing.id } });
}

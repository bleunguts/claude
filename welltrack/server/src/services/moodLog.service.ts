import type { PrismaClient } from "../generated/prisma/client.js";
import { prisma as defaultPrisma } from "../lib/prisma.js";
import { requireOwned } from "../lib/ownership.js";
import type {
  CreateMoodLogInput,
  MoodLogQuery,
  UpdateMoodLogInput,
} from "../validators/moodLog.validators.js";

export interface MoodLogListResult {
  items: unknown[];
  total: number;
}

const DEFAULT_PAGE_SIZE = 50;

export async function listMoodLogs(
  userId: string,
  query: MoodLogQuery,
  client: PrismaClient = defaultPrisma,
): Promise<MoodLogListResult> {
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
    client.moodLog.findMany({ where, orderBy: { loggedAt: "desc" }, take, skip }),
    client.moodLog.count({ where }),
  ]);

  return { items, total };
}

export async function createMoodLog(
  userId: string,
  input: CreateMoodLogInput,
  client: PrismaClient = defaultPrisma,
) {
  return client.moodLog.create({
    data: {
      userId,
      moodScore: input.moodScore,
      energyLevel: input.energyLevel,
      stressLevel: input.stressLevel,
      notes: input.notes,
      loggedAt: input.loggedAt ? new Date(input.loggedAt) : new Date(),
    },
  });
}

export async function updateMoodLog(
  userId: string,
  id: string,
  input: UpdateMoodLogInput,
  client: PrismaClient = defaultPrisma,
) {
  const existing = requireOwned(await client.moodLog.findUnique({ where: { id } }), userId);

  return client.moodLog.update({
    where: { id: existing.id },
    data: {
      ...(input.moodScore !== undefined && { moodScore: input.moodScore }),
      ...(input.energyLevel !== undefined && { energyLevel: input.energyLevel }),
      ...(input.stressLevel !== undefined && { stressLevel: input.stressLevel }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.loggedAt !== undefined && { loggedAt: new Date(input.loggedAt) }),
    },
  });
}

export async function deleteMoodLog(
  userId: string,
  id: string,
  client: PrismaClient = defaultPrisma,
): Promise<void> {
  const existing = requireOwned(await client.moodLog.findUnique({ where: { id } }), userId);
  await client.moodLog.delete({ where: { id: existing.id } });
}

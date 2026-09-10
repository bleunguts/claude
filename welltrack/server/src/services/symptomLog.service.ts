import type { PrismaClient } from "../generated/prisma/client.js";
import { prisma as defaultPrisma } from "../lib/prisma.js";
import { requireOwned } from "../lib/ownership.js";
import { getVisibleSymptomOrThrow } from "./symptom.service.js";
import type {
  CreateSymptomLogInput,
  SymptomLogQuery,
  UpdateSymptomLogInput,
} from "../validators/symptomLog.validators.js";

export interface SymptomLogListResult {
  items: unknown[];
  total: number;
}

const DEFAULT_PAGE_SIZE = 50;

export async function listSymptomLogs(
  userId: string,
  query: SymptomLogQuery,
  client: PrismaClient = defaultPrisma,
): Promise<SymptomLogListResult> {
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
    client.symptomLog.findMany({ where, orderBy: { loggedAt: "desc" }, take, skip }),
    client.symptomLog.count({ where }),
  ]);

  return { items, total };
}

export async function createSymptomLog(
  userId: string,
  input: CreateSymptomLogInput,
  client: PrismaClient = defaultPrisma,
) {
  await getVisibleSymptomOrThrow(input.symptomId, userId, client);

  return client.symptomLog.create({
    data: {
      userId,
      symptomId: input.symptomId,
      severity: input.severity,
      notes: input.notes,
      loggedAt: input.loggedAt ? new Date(input.loggedAt) : new Date(),
    },
  });
}

export async function updateSymptomLog(
  userId: string,
  id: string,
  input: UpdateSymptomLogInput,
  client: PrismaClient = defaultPrisma,
) {
  const existing = requireOwned(await client.symptomLog.findUnique({ where: { id } }), userId);

  if (input.symptomId !== undefined) {
    await getVisibleSymptomOrThrow(input.symptomId, userId, client);
  }

  return client.symptomLog.update({
    where: { id: existing.id },
    data: {
      ...(input.symptomId !== undefined && { symptomId: input.symptomId }),
      ...(input.severity !== undefined && { severity: input.severity }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.loggedAt !== undefined && { loggedAt: new Date(input.loggedAt) }),
    },
  });
}

export async function deleteSymptomLog(
  userId: string,
  id: string,
  client: PrismaClient = defaultPrisma,
): Promise<void> {
  const existing = requireOwned(await client.symptomLog.findUnique({ where: { id } }), userId);
  await client.symptomLog.delete({ where: { id: existing.id } });
}

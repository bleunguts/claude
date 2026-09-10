import type { PrismaClient } from "../generated/prisma/client.js";
import { prisma as defaultPrisma } from "../lib/prisma.js";
import { requireOwned } from "../lib/ownership.js";
import { getOwnedMedicationOrThrow } from "./medication.service.js";
import type {
  CreateMedicationLogInput,
  MedicationLogQuery,
  UpdateMedicationLogInput,
} from "../validators/medicationLog.validators.js";

export interface MedicationLogListResult {
  items: unknown[];
  total: number;
}

const DEFAULT_PAGE_SIZE = 50;

export async function listMedicationLogs(
  userId: string,
  query: MedicationLogQuery,
  client: PrismaClient = defaultPrisma,
): Promise<MedicationLogListResult> {
  const where = {
    userId,
    ...((query.startDate ?? query.endDate)
      ? {
          createdAt: {
            ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
            ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
          },
        }
      : {}),
  };

  const take = query.limit ?? DEFAULT_PAGE_SIZE;
  const skip = query.offset ?? 0;

  const [items, total] = await Promise.all([
    client.medicationLog.findMany({ where, orderBy: { createdAt: "desc" }, take, skip }),
    client.medicationLog.count({ where }),
  ]);

  return { items, total };
}

export async function createMedicationLog(
  userId: string,
  input: CreateMedicationLogInput,
  client: PrismaClient = defaultPrisma,
) {
  await getOwnedMedicationOrThrow(input.medicationId, userId, client);

  return client.medicationLog.create({
    data: {
      userId,
      medicationId: input.medicationId,
      taken: input.taken,
      notes: input.notes,
      takenAt: input.takenAt ? new Date(input.takenAt) : undefined,
    },
  });
}

export async function updateMedicationLog(
  userId: string,
  id: string,
  input: UpdateMedicationLogInput,
  client: PrismaClient = defaultPrisma,
) {
  const existing = requireOwned(
    await client.medicationLog.findUnique({ where: { id } }),
    userId,
  );

  if (input.medicationId !== undefined) {
    await getOwnedMedicationOrThrow(input.medicationId, userId, client);
  }

  return client.medicationLog.update({
    where: { id: existing.id },
    data: {
      ...(input.medicationId !== undefined && { medicationId: input.medicationId }),
      ...(input.taken !== undefined && { taken: input.taken }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.takenAt !== undefined && { takenAt: new Date(input.takenAt) }),
    },
  });
}

export async function deleteMedicationLog(
  userId: string,
  id: string,
  client: PrismaClient = defaultPrisma,
): Promise<void> {
  const existing = requireOwned(
    await client.medicationLog.findUnique({ where: { id } }),
    userId,
  );
  await client.medicationLog.delete({ where: { id: existing.id } });
}

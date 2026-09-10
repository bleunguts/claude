import type { PrismaClient } from "../generated/prisma/client.js";
import { prisma as defaultPrisma } from "../lib/prisma.js";
import { requireOwned } from "../lib/ownership.js";
import type { CreateMedicationInput } from "../validators/medication.validators.js";

export async function listMedications(userId: string, client: PrismaClient = defaultPrisma) {
  return client.medication.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
}

export async function createMedication(
  userId: string,
  input: CreateMedicationInput,
  client: PrismaClient = defaultPrisma,
) {
  return client.medication.create({
    data: { userId, name: input.name, dosage: input.dosage, frequency: input.frequency },
  });
}

/** Returns the medication if it is owned by userId, otherwise throws NotFoundError. */
export async function getOwnedMedicationOrThrow(
  medicationId: string,
  userId: string,
  client: PrismaClient = defaultPrisma,
) {
  const medication = await client.medication.findUnique({ where: { id: medicationId } });
  return requireOwned(medication, userId);
}

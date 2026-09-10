import type { PrismaClient } from "../generated/prisma/client.js";
import { prisma as defaultPrisma } from "../lib/prisma.js";
import { NotFoundError } from "../lib/errors.js";
import type { CreateSymptomInput } from "../validators/symptom.validators.js";

export async function listSymptoms(userId: string, client: PrismaClient = defaultPrisma) {
  return client.symptom.findMany({
    where: { OR: [{ userId: null }, { userId }] },
    orderBy: { name: "asc" },
  });
}

export async function createSymptom(
  userId: string,
  input: CreateSymptomInput,
  client: PrismaClient = defaultPrisma,
) {
  return client.symptom.create({
    data: { userId, name: input.name, category: input.category },
  });
}

/** Returns the symptom if it is a system default or owned by userId, otherwise throws NotFoundError. */
export async function getVisibleSymptomOrThrow(
  symptomId: string,
  userId: string,
  client: PrismaClient = defaultPrisma,
) {
  const symptom = await client.symptom.findUnique({ where: { id: symptomId } });
  if (!symptom || (symptom.userId !== null && symptom.userId !== userId)) {
    throw new NotFoundError("Symptom not found");
  }
  return symptom;
}

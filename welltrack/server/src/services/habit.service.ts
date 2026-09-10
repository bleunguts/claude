import type { PrismaClient } from "../generated/prisma/client.js";
import { prisma as defaultPrisma } from "../lib/prisma.js";
import { NotFoundError } from "../lib/errors.js";
import type { CreateHabitInput } from "../validators/habit.validators.js";

export async function listHabits(userId: string, client: PrismaClient = defaultPrisma) {
  return client.habit.findMany({
    where: { OR: [{ userId: null }, { userId }] },
    orderBy: { name: "asc" },
  });
}

export async function createHabit(
  userId: string,
  input: CreateHabitInput,
  client: PrismaClient = defaultPrisma,
) {
  return client.habit.create({
    data: { userId, name: input.name, trackingType: input.trackingType, unit: input.unit },
  });
}

/** Returns the habit if it is a system default or owned by userId, otherwise throws NotFoundError. */
export async function getVisibleHabitOrThrow(
  habitId: string,
  userId: string,
  client: PrismaClient = defaultPrisma,
) {
  const habit = await client.habit.findUnique({ where: { id: habitId } });
  if (!habit || (habit.userId !== null && habit.userId !== userId)) {
    throw new NotFoundError("Habit not found");
  }
  return habit;
}

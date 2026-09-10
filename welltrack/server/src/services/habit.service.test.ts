import { describe, it, expect, vi, beforeEach } from "vitest";
import { listHabits, createHabit, getVisibleHabitOrThrow } from "./habit.service.js";
import { NotFoundError } from "../lib/errors.js";
import type { PrismaClient } from "../generated/prisma/client.js";

function fakePrisma() {
  return {
    habit: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  } as unknown as PrismaClient & {
    habit: {
      findMany: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
    };
  };
}

describe("habit.service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("listHabits", () => {
    it("queries for system defaults and the caller's own habits, ordered by name", async () => {
      const client = fakePrisma();
      client.habit.findMany.mockResolvedValue([]);

      await listHabits("user-1", client);

      expect(client.habit.findMany).toHaveBeenCalledWith({
        where: { OR: [{ userId: null }, { userId: "user-1" }] },
        orderBy: { name: "asc" },
      });
    });
  });

  describe("createHabit", () => {
    it("creates a habit owned by the caller", async () => {
      const client = fakePrisma();
      client.habit.create.mockResolvedValue({ id: "habit-1" });

      await createHabit(
        "user-1",
        { name: "Drink water", trackingType: "numeric", unit: "glasses" },
        client,
      );

      expect(client.habit.create).toHaveBeenCalledWith({
        data: { userId: "user-1", name: "Drink water", trackingType: "numeric", unit: "glasses" },
      });
    });

    it("creates a habit without a unit", async () => {
      const client = fakePrisma();
      client.habit.create.mockResolvedValue({ id: "habit-1" });

      await createHabit("user-1", { name: "Meditate", trackingType: "boolean" }, client);

      expect(client.habit.create).toHaveBeenCalledWith({
        data: { userId: "user-1", name: "Meditate", trackingType: "boolean", unit: undefined },
      });
    });
  });

  describe("getVisibleHabitOrThrow", () => {
    it("returns a system default habit (null userId) for any caller", async () => {
      const client = fakePrisma();
      const habit = { id: "habit-1", userId: null };
      client.habit.findUnique.mockResolvedValue(habit);

      await expect(getVisibleHabitOrThrow("habit-1", "user-1", client)).resolves.toBe(habit);
    });

    it("returns the habit when owned by the caller", async () => {
      const client = fakePrisma();
      const habit = { id: "habit-1", userId: "user-1" };
      client.habit.findUnique.mockResolvedValue(habit);

      await expect(getVisibleHabitOrThrow("habit-1", "user-1", client)).resolves.toBe(habit);
    });

    it("throws NotFoundError when the habit does not exist", async () => {
      const client = fakePrisma();
      client.habit.findUnique.mockResolvedValue(null);

      await expect(getVisibleHabitOrThrow("missing", "user-1", client)).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });

    it("throws NotFoundError when the habit is owned by a different user", async () => {
      const client = fakePrisma();
      client.habit.findUnique.mockResolvedValue({ id: "habit-1", userId: "other-user" });

      await expect(getVisibleHabitOrThrow("habit-1", "user-1", client)).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });
});

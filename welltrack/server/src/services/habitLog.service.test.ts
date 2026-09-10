import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./habit.service.js", () => ({
  getVisibleHabitOrThrow: vi.fn(),
}));

import { getVisibleHabitOrThrow } from "./habit.service.js";
import {
  listHabitLogs,
  createHabitLog,
  updateHabitLog,
  deleteHabitLog,
} from "./habitLog.service.js";
import { NotFoundError, BadRequestError } from "../lib/errors.js";
import type { PrismaClient } from "../generated/prisma/client.js";

function fakePrisma() {
  return {
    habitLog: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  } as unknown as PrismaClient & {
    habitLog: {
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
  };
}

describe("habitLog.service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("listHabitLogs", () => {
    it("paginates with the default page size when limit/offset are omitted", async () => {
      const client = fakePrisma();
      client.habitLog.findMany.mockResolvedValue([{ id: "log-1" }]);
      client.habitLog.count.mockResolvedValue(1);

      const result = await listHabitLogs("user-1", {}, client);

      expect(client.habitLog.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        orderBy: { loggedAt: "desc" },
        take: 50,
        skip: 0,
      });
      expect(result).toEqual({ items: [{ id: "log-1" }], total: 1 });
    });

    it("filters by the given date range and pagination", async () => {
      const client = fakePrisma();
      client.habitLog.findMany.mockResolvedValue([]);
      client.habitLog.count.mockResolvedValue(0);

      await listHabitLogs(
        "user-1",
        {
          startDate: "2026-01-01T00:00:00Z",
          endDate: "2026-01-31T00:00:00Z",
          limit: 10,
          offset: 20,
        },
        client,
      );

      expect(client.habitLog.findMany).toHaveBeenCalledWith({
        where: {
          userId: "user-1",
          loggedAt: {
            gte: new Date("2026-01-01T00:00:00Z"),
            lte: new Date("2026-01-31T00:00:00Z"),
          },
        },
        orderBy: { loggedAt: "desc" },
        take: 10,
        skip: 20,
      });
    });
  });

  describe("createHabitLog", () => {
    it("validates the habit is visible to the caller before creating the log", async () => {
      const client = fakePrisma();
      vi.mocked(getVisibleHabitOrThrow).mockResolvedValue({
        id: "habit-1",
        trackingType: "numeric",
      } as never);
      client.habitLog.create.mockResolvedValue({ id: "log-1" });

      await createHabitLog("user-1", { habitId: "habit-1", valueNumeric: 3 }, client);

      expect(getVisibleHabitOrThrow).toHaveBeenCalledWith("habit-1", "user-1", client);
      expect(client.habitLog.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          habitId: "habit-1",
          valueBoolean: undefined,
          valueNumeric: 3,
          valueDuration: undefined,
          notes: undefined,
          loggedAt: expect.any(Date),
        },
      });
    });

    it("propagates NotFoundError when the habit is not visible", async () => {
      const client = fakePrisma();
      vi.mocked(getVisibleHabitOrThrow).mockRejectedValue(new NotFoundError("Habit not found"));

      await expect(
        createHabitLog("user-1", { habitId: "hidden", valueNumeric: 3 }, client),
      ).rejects.toBeInstanceOf(NotFoundError);
      expect(client.habitLog.create).not.toHaveBeenCalled();
    });

    it("uses the provided loggedAt instead of now when given", async () => {
      const client = fakePrisma();
      vi.mocked(getVisibleHabitOrThrow).mockResolvedValue({
        id: "habit-1",
        trackingType: "duration",
      } as never);
      client.habitLog.create.mockResolvedValue({ id: "log-1" });

      await createHabitLog(
        "user-1",
        { habitId: "habit-1", valueDuration: 20, loggedAt: "2026-01-01T00:00:00Z" },
        client,
      );

      expect(client.habitLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ loggedAt: new Date("2026-01-01T00:00:00Z") }),
        }),
      );
    });

    it("rejects a value that does not match the habit's trackingType", async () => {
      const client = fakePrisma();
      vi.mocked(getVisibleHabitOrThrow).mockResolvedValue({
        id: "habit-1",
        trackingType: "boolean",
      } as never);

      await expect(
        createHabitLog("user-1", { habitId: "habit-1", valueNumeric: 5 }, client),
      ).rejects.toBeInstanceOf(BadRequestError);
      expect(client.habitLog.create).not.toHaveBeenCalled();
    });

    it("rejects a value with no fields set at all", async () => {
      const client = fakePrisma();
      vi.mocked(getVisibleHabitOrThrow).mockResolvedValue({
        id: "habit-1",
        trackingType: "boolean",
      } as never);

      await expect(createHabitLog("user-1", { habitId: "habit-1" }, client)).rejects.toBeInstanceOf(
        BadRequestError,
      );
      expect(client.habitLog.create).not.toHaveBeenCalled();
    });
  });

  describe("updateHabitLog", () => {
    it("throws NotFoundError when the log does not belong to the caller", async () => {
      const client = fakePrisma();
      client.habitLog.findUnique.mockResolvedValue({ id: "log-1", userId: "other-user" });

      await expect(
        updateHabitLog("user-1", "log-1", { notes: "updated" }, client),
      ).rejects.toBeInstanceOf(NotFoundError);
      expect(client.habitLog.update).not.toHaveBeenCalled();
    });

    it("throws NotFoundError when the log does not exist", async () => {
      const client = fakePrisma();
      client.habitLog.findUnique.mockResolvedValue(null);

      await expect(
        updateHabitLog("user-1", "missing", { notes: "updated" }, client),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("updates non-value fields for an owned log without re-checking the habit", async () => {
      const client = fakePrisma();
      client.habitLog.findUnique.mockResolvedValue({
        id: "log-1",
        userId: "user-1",
        habitId: "habit-1",
        valueNumeric: 3,
      });
      client.habitLog.update.mockResolvedValue({ id: "log-1", notes: "updated" });

      await updateHabitLog("user-1", "log-1", { notes: "updated" }, client);

      expect(client.habitLog.update).toHaveBeenCalledWith({
        where: { id: "log-1" },
        data: { notes: "updated" },
      });
      expect(getVisibleHabitOrThrow).not.toHaveBeenCalled();
    });

    it("re-validates against the habit's trackingType when a value field is changed", async () => {
      const client = fakePrisma();
      client.habitLog.findUnique.mockResolvedValue({
        id: "log-1",
        userId: "user-1",
        habitId: "habit-1",
        valueNumeric: 3,
      });
      vi.mocked(getVisibleHabitOrThrow).mockResolvedValue({
        id: "habit-1",
        trackingType: "numeric",
      } as never);
      client.habitLog.update.mockResolvedValue({ id: "log-1", valueNumeric: 7 });

      await updateHabitLog("user-1", "log-1", { valueNumeric: 7 }, client);

      expect(getVisibleHabitOrThrow).toHaveBeenCalledWith("habit-1", "user-1", client);
      expect(client.habitLog.update).toHaveBeenCalledWith({
        where: { id: "log-1" },
        data: { valueNumeric: 7 },
      });
    });

    it("rejects switching to a value field that doesn't match the habit's trackingType", async () => {
      const client = fakePrisma();
      client.habitLog.findUnique.mockResolvedValue({
        id: "log-1",
        userId: "user-1",
        habitId: "habit-1",
        valueBoolean: true,
      });
      vi.mocked(getVisibleHabitOrThrow).mockResolvedValue({
        id: "habit-1",
        trackingType: "boolean",
      } as never);

      await expect(
        updateHabitLog("user-1", "log-1", { valueNumeric: 5 }, client),
      ).rejects.toBeInstanceOf(BadRequestError);
      expect(client.habitLog.update).not.toHaveBeenCalled();
    });
  });

  describe("deleteHabitLog", () => {
    it("throws NotFoundError and does not delete when the log belongs to a different user", async () => {
      const client = fakePrisma();
      client.habitLog.findUnique.mockResolvedValue({ id: "log-1", userId: "other-user" });

      await expect(deleteHabitLog("user-1", "log-1", client)).rejects.toBeInstanceOf(NotFoundError);
      expect(client.habitLog.delete).not.toHaveBeenCalled();
    });

    it("deletes an owned log", async () => {
      const client = fakePrisma();
      client.habitLog.findUnique.mockResolvedValue({ id: "log-1", userId: "user-1" });

      await deleteHabitLog("user-1", "log-1", client);

      expect(client.habitLog.delete).toHaveBeenCalledWith({ where: { id: "log-1" } });
    });
  });
});

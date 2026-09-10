import { describe, it, expect, vi, beforeEach } from "vitest";
import { listMoodLogs, createMoodLog, updateMoodLog, deleteMoodLog } from "./moodLog.service.js";
import { NotFoundError } from "../lib/errors.js";
import type { PrismaClient } from "../generated/prisma/client.js";

function fakePrisma() {
  return {
    moodLog: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  } as unknown as PrismaClient & {
    moodLog: {
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
  };
}

describe("moodLog.service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("listMoodLogs", () => {
    it("paginates with the default page size when limit/offset are omitted", async () => {
      const client = fakePrisma();
      client.moodLog.findMany.mockResolvedValue([{ id: "log-1" }]);
      client.moodLog.count.mockResolvedValue(1);

      const result = await listMoodLogs("user-1", {}, client);

      expect(client.moodLog.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        orderBy: { loggedAt: "desc" },
        take: 50,
        skip: 0,
      });
      expect(result).toEqual({ items: [{ id: "log-1" }], total: 1 });
    });

    it("filters by the given date range and pagination", async () => {
      const client = fakePrisma();
      client.moodLog.findMany.mockResolvedValue([]);
      client.moodLog.count.mockResolvedValue(0);

      await listMoodLogs(
        "user-1",
        {
          startDate: "2026-01-01T00:00:00Z",
          endDate: "2026-01-31T00:00:00Z",
          limit: 10,
          offset: 20,
        },
        client,
      );

      expect(client.moodLog.findMany).toHaveBeenCalledWith({
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

  describe("createMoodLog", () => {
    it("creates a log with the given fields", async () => {
      const client = fakePrisma();
      client.moodLog.create.mockResolvedValue({ id: "log-1" });

      await createMoodLog("user-1", { moodScore: 4, energyLevel: 3, stressLevel: 2 }, client);

      expect(client.moodLog.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          moodScore: 4,
          energyLevel: 3,
          stressLevel: 2,
          notes: undefined,
          loggedAt: expect.any(Date),
        },
      });
    });

    it("uses the provided loggedAt instead of now when given", async () => {
      const client = fakePrisma();
      client.moodLog.create.mockResolvedValue({ id: "log-1" });

      await createMoodLog("user-1", { moodScore: 4, loggedAt: "2026-01-01T00:00:00Z" }, client);

      expect(client.moodLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ loggedAt: new Date("2026-01-01T00:00:00Z") }),
        }),
      );
    });
  });

  describe("updateMoodLog", () => {
    it("throws NotFoundError when the log belongs to a different user", async () => {
      const client = fakePrisma();
      client.moodLog.findUnique.mockResolvedValue({ id: "log-1", userId: "other-user" });

      await expect(
        updateMoodLog("user-1", "log-1", { moodScore: 3 }, client),
      ).rejects.toBeInstanceOf(NotFoundError);
      expect(client.moodLog.update).not.toHaveBeenCalled();
    });

    it("throws NotFoundError when the log does not exist", async () => {
      const client = fakePrisma();
      client.moodLog.findUnique.mockResolvedValue(null);

      await expect(
        updateMoodLog("user-1", "missing", { moodScore: 3 }, client),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("updates only the provided fields for an owned log", async () => {
      const client = fakePrisma();
      client.moodLog.findUnique.mockResolvedValue({ id: "log-1", userId: "user-1" });
      client.moodLog.update.mockResolvedValue({ id: "log-1", moodScore: 3 });

      await updateMoodLog("user-1", "log-1", { moodScore: 3 }, client);

      expect(client.moodLog.update).toHaveBeenCalledWith({
        where: { id: "log-1" },
        data: { moodScore: 3 },
      });
    });
  });

  describe("deleteMoodLog", () => {
    it("throws NotFoundError and does not delete when the log belongs to a different user", async () => {
      const client = fakePrisma();
      client.moodLog.findUnique.mockResolvedValue({ id: "log-1", userId: "other-user" });

      await expect(deleteMoodLog("user-1", "log-1", client)).rejects.toBeInstanceOf(NotFoundError);
      expect(client.moodLog.delete).not.toHaveBeenCalled();
    });

    it("deletes an owned log", async () => {
      const client = fakePrisma();
      client.moodLog.findUnique.mockResolvedValue({ id: "log-1", userId: "user-1" });

      await deleteMoodLog("user-1", "log-1", client);

      expect(client.moodLog.delete).toHaveBeenCalledWith({ where: { id: "log-1" } });
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./symptom.service.js", () => ({
  getVisibleSymptomOrThrow: vi.fn(),
}));

import { getVisibleSymptomOrThrow } from "./symptom.service.js";
import {
  listSymptomLogs,
  createSymptomLog,
  updateSymptomLog,
  deleteSymptomLog,
} from "./symptomLog.service.js";
import { NotFoundError } from "../lib/errors.js";
import type { PrismaClient } from "../generated/prisma/client.js";

function fakePrisma() {
  return {
    symptomLog: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  } as unknown as PrismaClient & {
    symptomLog: {
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
  };
}

describe("symptomLog.service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("listSymptomLogs", () => {
    it("paginates with the default page size when limit/offset are omitted", async () => {
      const client = fakePrisma();
      client.symptomLog.findMany.mockResolvedValue([{ id: "log-1" }]);
      client.symptomLog.count.mockResolvedValue(1);

      const result = await listSymptomLogs("user-1", {}, client);

      expect(client.symptomLog.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        orderBy: { loggedAt: "desc" },
        take: 50,
        skip: 0,
      });
      expect(result).toEqual({ items: [{ id: "log-1" }], total: 1 });
    });

    it("filters by the given date range and pagination", async () => {
      const client = fakePrisma();
      client.symptomLog.findMany.mockResolvedValue([]);
      client.symptomLog.count.mockResolvedValue(0);

      await listSymptomLogs(
        "user-1",
        {
          startDate: "2026-01-01T00:00:00Z",
          endDate: "2026-01-31T00:00:00Z",
          limit: 10,
          offset: 20,
        },
        client,
      );

      expect(client.symptomLog.findMany).toHaveBeenCalledWith({
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

  describe("createSymptomLog", () => {
    it("validates the symptom is visible to the caller before creating the log", async () => {
      const client = fakePrisma();
      vi.mocked(getVisibleSymptomOrThrow).mockResolvedValue({} as never);
      client.symptomLog.create.mockResolvedValue({ id: "log-1" });

      await createSymptomLog("user-1", { symptomId: "symptom-1", severity: 5 }, client);

      expect(getVisibleSymptomOrThrow).toHaveBeenCalledWith("symptom-1", "user-1", client);
      expect(client.symptomLog.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          symptomId: "symptom-1",
          severity: 5,
          notes: undefined,
          loggedAt: expect.any(Date),
        },
      });
    });

    it("propagates NotFoundError when the symptom is not visible", async () => {
      const client = fakePrisma();
      vi.mocked(getVisibleSymptomOrThrow).mockRejectedValue(new NotFoundError("Symptom not found"));

      await expect(
        createSymptomLog("user-1", { symptomId: "hidden", severity: 5 }, client),
      ).rejects.toBeInstanceOf(NotFoundError);
      expect(client.symptomLog.create).not.toHaveBeenCalled();
    });

    it("uses the provided loggedAt instead of now when given", async () => {
      const client = fakePrisma();
      vi.mocked(getVisibleSymptomOrThrow).mockResolvedValue({} as never);
      client.symptomLog.create.mockResolvedValue({ id: "log-1" });

      await createSymptomLog(
        "user-1",
        { symptomId: "symptom-1", severity: 5, loggedAt: "2026-01-01T00:00:00Z" },
        client,
      );

      expect(client.symptomLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ loggedAt: new Date("2026-01-01T00:00:00Z") }),
        }),
      );
    });
  });

  describe("updateSymptomLog", () => {
    it("throws NotFoundError when the log does not belong to the caller", async () => {
      const client = fakePrisma();
      client.symptomLog.findUnique.mockResolvedValue({ id: "log-1", userId: "other-user" });

      await expect(
        updateSymptomLog("user-1", "log-1", { severity: 3 }, client),
      ).rejects.toBeInstanceOf(NotFoundError);
      expect(client.symptomLog.update).not.toHaveBeenCalled();
    });

    it("throws NotFoundError when the log does not exist", async () => {
      const client = fakePrisma();
      client.symptomLog.findUnique.mockResolvedValue(null);

      await expect(
        updateSymptomLog("user-1", "missing", { severity: 3 }, client),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("updates only the provided fields for an owned log", async () => {
      const client = fakePrisma();
      client.symptomLog.findUnique.mockResolvedValue({ id: "log-1", userId: "user-1" });
      client.symptomLog.update.mockResolvedValue({ id: "log-1", severity: 3 });

      await updateSymptomLog("user-1", "log-1", { severity: 3 }, client);

      expect(client.symptomLog.update).toHaveBeenCalledWith({
        where: { id: "log-1" },
        data: { severity: 3 },
      });
      expect(getVisibleSymptomOrThrow).not.toHaveBeenCalled();
    });

    it("re-validates symptom visibility when symptomId is being changed", async () => {
      const client = fakePrisma();
      client.symptomLog.findUnique.mockResolvedValue({ id: "log-1", userId: "user-1" });
      vi.mocked(getVisibleSymptomOrThrow).mockResolvedValue({} as never);
      client.symptomLog.update.mockResolvedValue({ id: "log-1" });

      await updateSymptomLog("user-1", "log-1", { symptomId: "symptom-2" }, client);

      expect(getVisibleSymptomOrThrow).toHaveBeenCalledWith("symptom-2", "user-1", client);
    });
  });

  describe("deleteSymptomLog", () => {
    it("throws NotFoundError and does not delete when the log belongs to a different user", async () => {
      const client = fakePrisma();
      client.symptomLog.findUnique.mockResolvedValue({ id: "log-1", userId: "other-user" });

      await expect(deleteSymptomLog("user-1", "log-1", client)).rejects.toBeInstanceOf(
        NotFoundError,
      );
      expect(client.symptomLog.delete).not.toHaveBeenCalled();
    });

    it("deletes an owned log", async () => {
      const client = fakePrisma();
      client.symptomLog.findUnique.mockResolvedValue({ id: "log-1", userId: "user-1" });

      await deleteSymptomLog("user-1", "log-1", client);

      expect(client.symptomLog.delete).toHaveBeenCalledWith({ where: { id: "log-1" } });
    });
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./medication.service.js", () => ({
  getOwnedMedicationOrThrow: vi.fn(),
}));

import { getOwnedMedicationOrThrow } from "./medication.service.js";
import {
  listMedicationLogs,
  createMedicationLog,
  updateMedicationLog,
  deleteMedicationLog,
} from "./medicationLog.service.js";
import { NotFoundError } from "../lib/errors.js";
import type { PrismaClient } from "../generated/prisma/client.js";

function fakePrisma() {
  return {
    medicationLog: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  } as unknown as PrismaClient & {
    medicationLog: {
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
  };
}

describe("medicationLog.service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("listMedicationLogs", () => {
    it("paginates with the default page size when limit/offset are omitted", async () => {
      const client = fakePrisma();
      client.medicationLog.findMany.mockResolvedValue([{ id: "log-1" }]);
      client.medicationLog.count.mockResolvedValue(1);

      const result = await listMedicationLogs("user-1", {}, client);

      expect(client.medicationLog.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        orderBy: { createdAt: "desc" },
        take: 50,
        skip: 0,
      });
      expect(result).toEqual({ items: [{ id: "log-1" }], total: 1 });
    });

    it("filters by the given date range and pagination on createdAt", async () => {
      const client = fakePrisma();
      client.medicationLog.findMany.mockResolvedValue([]);
      client.medicationLog.count.mockResolvedValue(0);

      await listMedicationLogs(
        "user-1",
        {
          startDate: "2026-01-01T00:00:00Z",
          endDate: "2026-01-31T00:00:00Z",
          limit: 10,
          offset: 20,
        },
        client,
      );

      expect(client.medicationLog.findMany).toHaveBeenCalledWith({
        where: {
          userId: "user-1",
          createdAt: {
            gte: new Date("2026-01-01T00:00:00Z"),
            lte: new Date("2026-01-31T00:00:00Z"),
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        skip: 20,
      });
    });
  });

  describe("createMedicationLog", () => {
    it("validates the medication is owned by the caller before creating the log", async () => {
      const client = fakePrisma();
      vi.mocked(getOwnedMedicationOrThrow).mockResolvedValue({} as never);
      client.medicationLog.create.mockResolvedValue({ id: "log-1" });

      await createMedicationLog("user-1", { medicationId: "medication-1", taken: true }, client);

      expect(getOwnedMedicationOrThrow).toHaveBeenCalledWith("medication-1", "user-1", client);
      expect(client.medicationLog.create).toHaveBeenCalledWith({
        data: {
          userId: "user-1",
          medicationId: "medication-1",
          taken: true,
          notes: undefined,
          takenAt: undefined,
        },
      });
    });

    it("propagates NotFoundError when the medication is not owned by the caller", async () => {
      const client = fakePrisma();
      vi.mocked(getOwnedMedicationOrThrow).mockRejectedValue(
        new NotFoundError("Resource not found"),
      );

      await expect(
        createMedicationLog("user-1", { medicationId: "hidden", taken: true }, client),
      ).rejects.toBeInstanceOf(NotFoundError);
      expect(client.medicationLog.create).not.toHaveBeenCalled();
    });

    it("uses the provided takenAt instead of leaving it unset when given", async () => {
      const client = fakePrisma();
      vi.mocked(getOwnedMedicationOrThrow).mockResolvedValue({} as never);
      client.medicationLog.create.mockResolvedValue({ id: "log-1" });

      await createMedicationLog(
        "user-1",
        { medicationId: "medication-1", taken: true, takenAt: "2026-01-01T00:00:00Z" },
        client,
      );

      expect(client.medicationLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ takenAt: new Date("2026-01-01T00:00:00Z") }),
        }),
      );
    });
  });

  describe("updateMedicationLog", () => {
    it("throws NotFoundError when the log does not belong to the caller", async () => {
      const client = fakePrisma();
      client.medicationLog.findUnique.mockResolvedValue({ id: "log-1", userId: "other-user" });

      await expect(
        updateMedicationLog("user-1", "log-1", { taken: false }, client),
      ).rejects.toBeInstanceOf(NotFoundError);
      expect(client.medicationLog.update).not.toHaveBeenCalled();
    });

    it("throws NotFoundError when the log does not exist", async () => {
      const client = fakePrisma();
      client.medicationLog.findUnique.mockResolvedValue(null);

      await expect(
        updateMedicationLog("user-1", "missing", { taken: false }, client),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("updates only the provided fields for an owned log", async () => {
      const client = fakePrisma();
      client.medicationLog.findUnique.mockResolvedValue({ id: "log-1", userId: "user-1" });
      client.medicationLog.update.mockResolvedValue({ id: "log-1", taken: false });

      await updateMedicationLog("user-1", "log-1", { taken: false }, client);

      expect(client.medicationLog.update).toHaveBeenCalledWith({
        where: { id: "log-1" },
        data: { taken: false },
      });
      expect(getOwnedMedicationOrThrow).not.toHaveBeenCalled();
    });

    it("re-validates medication ownership when medicationId is being changed", async () => {
      const client = fakePrisma();
      client.medicationLog.findUnique.mockResolvedValue({ id: "log-1", userId: "user-1" });
      vi.mocked(getOwnedMedicationOrThrow).mockResolvedValue({} as never);
      client.medicationLog.update.mockResolvedValue({ id: "log-1" });

      await updateMedicationLog("user-1", "log-1", { medicationId: "medication-2" }, client);

      expect(getOwnedMedicationOrThrow).toHaveBeenCalledWith("medication-2", "user-1", client);
    });
  });

  describe("deleteMedicationLog", () => {
    it("throws NotFoundError and does not delete when the log belongs to a different user", async () => {
      const client = fakePrisma();
      client.medicationLog.findUnique.mockResolvedValue({ id: "log-1", userId: "other-user" });

      await expect(deleteMedicationLog("user-1", "log-1", client)).rejects.toBeInstanceOf(
        NotFoundError,
      );
      expect(client.medicationLog.delete).not.toHaveBeenCalled();
    });

    it("deletes an owned log", async () => {
      const client = fakePrisma();
      client.medicationLog.findUnique.mockResolvedValue({ id: "log-1", userId: "user-1" });

      await deleteMedicationLog("user-1", "log-1", client);

      expect(client.medicationLog.delete).toHaveBeenCalledWith({ where: { id: "log-1" } });
    });
  });
});

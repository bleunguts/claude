import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listMedications,
  createMedication,
  getOwnedMedicationOrThrow,
} from "./medication.service.js";
import { NotFoundError } from "../lib/errors.js";
import type { PrismaClient } from "../generated/prisma/client.js";

function fakePrisma() {
  return {
    medication: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  } as unknown as PrismaClient & {
    medication: {
      findMany: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
    };
  };
}

describe("medication.service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("listMedications", () => {
    it("queries for the caller's own medications, ordered by name", async () => {
      const client = fakePrisma();
      client.medication.findMany.mockResolvedValue([]);

      await listMedications("user-1", client);

      expect(client.medication.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        orderBy: { name: "asc" },
      });
    });
  });

  describe("createMedication", () => {
    it("creates a medication owned by the caller", async () => {
      const client = fakePrisma();
      client.medication.create.mockResolvedValue({ id: "medication-1" });

      await createMedication(
        "user-1",
        { name: "Ibuprofen", dosage: "200mg", frequency: "daily" },
        client,
      );

      expect(client.medication.create).toHaveBeenCalledWith({
        data: { userId: "user-1", name: "Ibuprofen", dosage: "200mg", frequency: "daily" },
      });
    });
  });

  describe("getOwnedMedicationOrThrow", () => {
    it("returns the medication when owned by the caller", async () => {
      const client = fakePrisma();
      const medication = { id: "medication-1", userId: "user-1" };
      client.medication.findUnique.mockResolvedValue(medication);

      await expect(getOwnedMedicationOrThrow("medication-1", "user-1", client)).resolves.toBe(
        medication,
      );
    });

    it("throws NotFoundError when the medication does not exist", async () => {
      const client = fakePrisma();
      client.medication.findUnique.mockResolvedValue(null);

      await expect(
        getOwnedMedicationOrThrow("missing", "user-1", client),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("throws NotFoundError when the medication is owned by a different user", async () => {
      const client = fakePrisma();
      client.medication.findUnique.mockResolvedValue({ id: "medication-1", userId: "other-user" });

      await expect(
        getOwnedMedicationOrThrow("medication-1", "user-1", client),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});

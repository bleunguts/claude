import { describe, it, expect, vi, beforeEach } from "vitest";
import { listSymptoms, createSymptom, getVisibleSymptomOrThrow } from "./symptom.service.js";
import { NotFoundError } from "../lib/errors.js";
import type { PrismaClient } from "../generated/prisma/client.js";

function fakePrisma() {
  return {
    symptom: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  } as unknown as PrismaClient & {
    symptom: {
      findMany: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
    };
  };
}

describe("symptom.service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("listSymptoms", () => {
    it("queries for system defaults and the caller's own symptoms, ordered by name", async () => {
      const client = fakePrisma();
      client.symptom.findMany.mockResolvedValue([]);

      await listSymptoms("user-1", client);

      expect(client.symptom.findMany).toHaveBeenCalledWith({
        where: { OR: [{ userId: null }, { userId: "user-1" }] },
        orderBy: { name: "asc" },
      });
    });
  });

  describe("createSymptom", () => {
    it("creates a symptom owned by the caller", async () => {
      const client = fakePrisma();
      client.symptom.create.mockResolvedValue({ id: "symptom-1" });

      await createSymptom("user-1", { name: "Headache", category: "pain" }, client);

      expect(client.symptom.create).toHaveBeenCalledWith({
        data: { userId: "user-1", name: "Headache", category: "pain" },
      });
    });
  });

  describe("getVisibleSymptomOrThrow", () => {
    it("returns a system default symptom (null userId) for any caller", async () => {
      const client = fakePrisma();
      const symptom = { id: "symptom-1", userId: null };
      client.symptom.findUnique.mockResolvedValue(symptom);

      await expect(getVisibleSymptomOrThrow("symptom-1", "user-1", client)).resolves.toBe(symptom);
    });

    it("returns the symptom when owned by the caller", async () => {
      const client = fakePrisma();
      const symptom = { id: "symptom-1", userId: "user-1" };
      client.symptom.findUnique.mockResolvedValue(symptom);

      await expect(getVisibleSymptomOrThrow("symptom-1", "user-1", client)).resolves.toBe(symptom);
    });

    it("throws NotFoundError when the symptom does not exist", async () => {
      const client = fakePrisma();
      client.symptom.findUnique.mockResolvedValue(null);

      await expect(getVisibleSymptomOrThrow("missing", "user-1", client)).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });

    it("throws NotFoundError when the symptom is owned by a different user", async () => {
      const client = fakePrisma();
      client.symptom.findUnique.mockResolvedValue({ id: "symptom-1", userId: "other-user" });

      await expect(getVisibleSymptomOrThrow("symptom-1", "user-1", client)).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });
  });
});

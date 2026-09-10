import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../services/medication.service.js", () => ({
  listMedications: vi.fn(),
  createMedication: vi.fn(),
}));
vi.mock("../services/medicationLog.service.js", () => ({
  listMedicationLogs: vi.fn(),
  createMedicationLog: vi.fn(),
  updateMedicationLog: vi.fn(),
  deleteMedicationLog: vi.fn(),
}));

import { listMedications, createMedication } from "../services/medication.service.js";
import {
  listMedicationLogs,
  createMedicationLog,
  updateMedicationLog,
  deleteMedicationLog,
} from "../services/medicationLog.service.js";
import { NotFoundError } from "../lib/errors.js";
import { signAccessToken } from "../services/tokenService.js";
import { app } from "../app.js";

const token = signAccessToken({ sub: "user-1" });
const authHeader = `Bearer ${token}`;

describe("medication routes auth requirement", () => {
  it("returns 401 without a bearer token", async () => {
    const res = await request(app).get("/api/medications");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/medications", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns the caller's medications", async () => {
    vi.mocked(listMedications).mockResolvedValue([{ id: "medication-1" }] as never);

    const res = await request(app).get("/api/medications").set("Authorization", authHeader);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ medications: [{ id: "medication-1" }] });
    expect(listMedications).toHaveBeenCalledWith("user-1");
  });
});

describe("POST /api/medications", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("creates a medication for a valid body", async () => {
    vi.mocked(createMedication).mockResolvedValue({ id: "medication-1" } as never);

    const res = await request(app)
      .post("/api/medications")
      .set("Authorization", authHeader)
      .send({ name: "Ibuprofen", dosage: "200mg", frequency: "daily" });

    expect(res.status).toBe(201);
    expect(createMedication).toHaveBeenCalledWith("user-1", {
      name: "Ibuprofen",
      dosage: "200mg",
      frequency: "daily",
    });
  });

  it("returns 400 and does not call the service for a missing name", async () => {
    const res = await request(app)
      .post("/api/medications")
      .set("Authorization", authHeader)
      .send({ dosage: "200mg" });

    expect(res.status).toBe(400);
    expect(createMedication).not.toHaveBeenCalled();
  });
});

describe("GET /api/medication-logs", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns the paginated result for a valid query", async () => {
    vi.mocked(listMedicationLogs).mockResolvedValue({ items: [], total: 0 });

    const res = await request(app)
      .get("/api/medication-logs")
      .query({ limit: "10", offset: "0" })
      .set("Authorization", authHeader);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [], total: 0 });
    expect(listMedicationLogs).toHaveBeenCalledWith("user-1", { limit: 10, offset: 0 });
  });

  it("returns 400 for an invalid query string", async () => {
    const res = await request(app)
      .get("/api/medication-logs")
      .query({ limit: "not-a-number" })
      .set("Authorization", authHeader);

    expect(res.status).toBe(400);
    expect(listMedicationLogs).not.toHaveBeenCalled();
  });
});

describe("POST /api/medication-logs", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const validBody = { medicationId: "123e4567-e89b-12d3-a456-426614174000", taken: true };

  it("creates a log for a valid body", async () => {
    vi.mocked(createMedicationLog).mockResolvedValue({ id: "log-1" } as never);

    const res = await request(app)
      .post("/api/medication-logs")
      .set("Authorization", authHeader)
      .send(validBody);

    expect(res.status).toBe(201);
    expect(createMedicationLog).toHaveBeenCalledWith("user-1", validBody);
  });

  it("returns 400 and does not call the service for a missing taken field", async () => {
    const res = await request(app)
      .post("/api/medication-logs")
      .set("Authorization", authHeader)
      .send({ medicationId: validBody.medicationId });

    expect(res.status).toBe(400);
    expect(createMedicationLog).not.toHaveBeenCalled();
  });

  it("returns 400 and does not call the service for an invalid medicationId", async () => {
    const res = await request(app)
      .post("/api/medication-logs")
      .set("Authorization", authHeader)
      .send({ ...validBody, medicationId: "not-a-uuid" });

    expect(res.status).toBe(400);
    expect(createMedicationLog).not.toHaveBeenCalled();
  });

  it("returns 404 when the service rejects with NotFoundError for an unreachable medication", async () => {
    vi.mocked(createMedicationLog).mockRejectedValue(new NotFoundError("Resource not found"));

    const res = await request(app)
      .post("/api/medication-logs")
      .set("Authorization", authHeader)
      .send(validBody);

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ error: { code: "NOT_FOUND" } });
  });
});

describe("PATCH /api/medication-logs/:id", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("updates a log for a valid body", async () => {
    vi.mocked(updateMedicationLog).mockResolvedValue({ id: "log-1", taken: false } as never);

    const res = await request(app)
      .patch("/api/medication-logs/log-1")
      .set("Authorization", authHeader)
      .send({ taken: false });

    expect(res.status).toBe(200);
    expect(updateMedicationLog).toHaveBeenCalledWith("user-1", "log-1", { taken: false });
  });

  it("returns 404 for a cross-user access attempt", async () => {
    vi.mocked(updateMedicationLog).mockRejectedValue(new NotFoundError("Resource not found"));

    const res = await request(app)
      .patch("/api/medication-logs/someone-elses-log")
      .set("Authorization", authHeader)
      .send({ taken: false });

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ error: { code: "NOT_FOUND" } });
  });
});

describe("DELETE /api/medication-logs/:id", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("deletes an owned log and returns 204", async () => {
    vi.mocked(deleteMedicationLog).mockResolvedValue(undefined);

    const res = await request(app)
      .delete("/api/medication-logs/log-1")
      .set("Authorization", authHeader);

    expect(res.status).toBe(204);
    expect(deleteMedicationLog).toHaveBeenCalledWith("user-1", "log-1");
  });

  it("returns 404 for a cross-user access attempt", async () => {
    vi.mocked(deleteMedicationLog).mockRejectedValue(new NotFoundError("Resource not found"));

    const res = await request(app)
      .delete("/api/medication-logs/someone-elses-log")
      .set("Authorization", authHeader);

    expect(res.status).toBe(404);
  });
});

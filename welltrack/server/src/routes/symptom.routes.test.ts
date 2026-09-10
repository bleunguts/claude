import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../services/symptom.service.js", () => ({
  listSymptoms: vi.fn(),
  createSymptom: vi.fn(),
}));
vi.mock("../services/symptomLog.service.js", () => ({
  listSymptomLogs: vi.fn(),
  createSymptomLog: vi.fn(),
  updateSymptomLog: vi.fn(),
  deleteSymptomLog: vi.fn(),
}));

import { listSymptoms, createSymptom } from "../services/symptom.service.js";
import {
  listSymptomLogs,
  createSymptomLog,
  updateSymptomLog,
  deleteSymptomLog,
} from "../services/symptomLog.service.js";
import { NotFoundError } from "../lib/errors.js";
import { signAccessToken } from "../services/tokenService.js";
import { app } from "../app.js";

const token = signAccessToken({ sub: "user-1" });
const authHeader = `Bearer ${token}`;

describe("symptom routes auth requirement", () => {
  it("returns 401 without a bearer token", async () => {
    const res = await request(app).get("/api/symptoms");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/symptoms", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns the caller's visible symptoms", async () => {
    vi.mocked(listSymptoms).mockResolvedValue([{ id: "symptom-1" }] as never);

    const res = await request(app).get("/api/symptoms").set("Authorization", authHeader);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ symptoms: [{ id: "symptom-1" }] });
    expect(listSymptoms).toHaveBeenCalledWith("user-1");
  });
});

describe("POST /api/symptoms", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("creates a symptom for a valid body", async () => {
    vi.mocked(createSymptom).mockResolvedValue({ id: "symptom-1" } as never);

    const res = await request(app)
      .post("/api/symptoms")
      .set("Authorization", authHeader)
      .send({ name: "Headache", category: "pain" });

    expect(res.status).toBe(201);
    expect(createSymptom).toHaveBeenCalledWith("user-1", { name: "Headache", category: "pain" });
  });

  it("returns 400 and does not call the service for a missing name", async () => {
    const res = await request(app)
      .post("/api/symptoms")
      .set("Authorization", authHeader)
      .send({ category: "pain" });

    expect(res.status).toBe(400);
    expect(createSymptom).not.toHaveBeenCalled();
  });
});

describe("GET /api/symptom-logs", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns the paginated result for a valid query", async () => {
    vi.mocked(listSymptomLogs).mockResolvedValue({ items: [], total: 0 });

    const res = await request(app)
      .get("/api/symptom-logs")
      .query({ limit: "10", offset: "0" })
      .set("Authorization", authHeader);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [], total: 0 });
    expect(listSymptomLogs).toHaveBeenCalledWith("user-1", { limit: 10, offset: 0 });
  });

  it("returns 400 for an invalid query string", async () => {
    const res = await request(app)
      .get("/api/symptom-logs")
      .query({ limit: "not-a-number" })
      .set("Authorization", authHeader);

    expect(res.status).toBe(400);
    expect(listSymptomLogs).not.toHaveBeenCalled();
  });
});

describe("POST /api/symptom-logs", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const validBody = { symptomId: "123e4567-e89b-12d3-a456-426614174000", severity: 5 };

  it("creates a log for a valid body", async () => {
    vi.mocked(createSymptomLog).mockResolvedValue({ id: "log-1" } as never);

    const res = await request(app)
      .post("/api/symptom-logs")
      .set("Authorization", authHeader)
      .send(validBody);

    expect(res.status).toBe(201);
    expect(createSymptomLog).toHaveBeenCalledWith("user-1", validBody);
  });

  it("returns 400 and does not call the service for an out-of-range severity", async () => {
    const res = await request(app)
      .post("/api/symptom-logs")
      .set("Authorization", authHeader)
      .send({ ...validBody, severity: 11 });

    expect(res.status).toBe(400);
    expect(createSymptomLog).not.toHaveBeenCalled();
  });

  it("returns 404 when the service rejects with NotFoundError for an unreachable symptom", async () => {
    vi.mocked(createSymptomLog).mockRejectedValue(new NotFoundError("Symptom not found"));

    const res = await request(app)
      .post("/api/symptom-logs")
      .set("Authorization", authHeader)
      .send(validBody);

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ error: { code: "NOT_FOUND" } });
  });
});

describe("PATCH /api/symptom-logs/:id", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("updates a log for a valid body", async () => {
    vi.mocked(updateSymptomLog).mockResolvedValue({ id: "log-1", severity: 3 } as never);

    const res = await request(app)
      .patch("/api/symptom-logs/log-1")
      .set("Authorization", authHeader)
      .send({ severity: 3 });

    expect(res.status).toBe(200);
    expect(updateSymptomLog).toHaveBeenCalledWith("user-1", "log-1", { severity: 3 });
  });

  it("returns 404 for a cross-user access attempt", async () => {
    vi.mocked(updateSymptomLog).mockRejectedValue(new NotFoundError("Resource not found"));

    const res = await request(app)
      .patch("/api/symptom-logs/someone-elses-log")
      .set("Authorization", authHeader)
      .send({ severity: 3 });

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ error: { code: "NOT_FOUND" } });
  });
});

describe("DELETE /api/symptom-logs/:id", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("deletes an owned log and returns 204", async () => {
    vi.mocked(deleteSymptomLog).mockResolvedValue(undefined);

    const res = await request(app)
      .delete("/api/symptom-logs/log-1")
      .set("Authorization", authHeader);

    expect(res.status).toBe(204);
    expect(deleteSymptomLog).toHaveBeenCalledWith("user-1", "log-1");
  });

  it("returns 404 for a cross-user access attempt", async () => {
    vi.mocked(deleteSymptomLog).mockRejectedValue(new NotFoundError("Resource not found"));

    const res = await request(app)
      .delete("/api/symptom-logs/someone-elses-log")
      .set("Authorization", authHeader);

    expect(res.status).toBe(404);
  });
});

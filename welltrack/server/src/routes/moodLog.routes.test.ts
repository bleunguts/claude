import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../services/moodLog.service.js", () => ({
  listMoodLogs: vi.fn(),
  createMoodLog: vi.fn(),
  updateMoodLog: vi.fn(),
  deleteMoodLog: vi.fn(),
}));

import {
  listMoodLogs,
  createMoodLog,
  updateMoodLog,
  deleteMoodLog,
} from "../services/moodLog.service.js";
import { NotFoundError } from "../lib/errors.js";
import { signAccessToken } from "../services/tokenService.js";
import { app } from "../app.js";

const token = signAccessToken({ sub: "user-1" });
const authHeader = `Bearer ${token}`;

describe("mood-logs routes auth requirement", () => {
  it("returns 401 without a bearer token", async () => {
    const res = await request(app).get("/api/mood-logs");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/mood-logs", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns the paginated result for a valid query", async () => {
    vi.mocked(listMoodLogs).mockResolvedValue({ items: [], total: 0 });

    const res = await request(app)
      .get("/api/mood-logs")
      .query({ limit: "10", offset: "0" })
      .set("Authorization", authHeader);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [], total: 0 });
    expect(listMoodLogs).toHaveBeenCalledWith("user-1", { limit: 10, offset: 0 });
  });

  it("returns 400 for an invalid query string", async () => {
    const res = await request(app)
      .get("/api/mood-logs")
      .query({ limit: "not-a-number" })
      .set("Authorization", authHeader);

    expect(res.status).toBe(400);
    expect(listMoodLogs).not.toHaveBeenCalled();
  });
});

describe("POST /api/mood-logs", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const validBody = { moodScore: 4, energyLevel: 3, stressLevel: 2 };

  it("creates a log for a valid body", async () => {
    vi.mocked(createMoodLog).mockResolvedValue({ id: "log-1" } as never);

    const res = await request(app)
      .post("/api/mood-logs")
      .set("Authorization", authHeader)
      .send(validBody);

    expect(res.status).toBe(201);
    expect(createMoodLog).toHaveBeenCalledWith("user-1", validBody);
  });

  it("returns 400 and does not call the service for an out-of-range moodScore", async () => {
    const res = await request(app)
      .post("/api/mood-logs")
      .set("Authorization", authHeader)
      .send({ ...validBody, moodScore: 6 });

    expect(res.status).toBe(400);
    expect(createMoodLog).not.toHaveBeenCalled();
  });

  it("returns 400 and does not call the service for an out-of-range energyLevel", async () => {
    const res = await request(app)
      .post("/api/mood-logs")
      .set("Authorization", authHeader)
      .send({ ...validBody, energyLevel: 0 });

    expect(res.status).toBe(400);
    expect(createMoodLog).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/mood-logs/:id", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("updates a log for a valid body", async () => {
    vi.mocked(updateMoodLog).mockResolvedValue({ id: "log-1", moodScore: 3 } as never);

    const res = await request(app)
      .patch("/api/mood-logs/log-1")
      .set("Authorization", authHeader)
      .send({ moodScore: 3 });

    expect(res.status).toBe(200);
    expect(updateMoodLog).toHaveBeenCalledWith("user-1", "log-1", { moodScore: 3 });
  });

  it("returns 404 for a cross-user access attempt", async () => {
    vi.mocked(updateMoodLog).mockRejectedValue(new NotFoundError("Resource not found"));

    const res = await request(app)
      .patch("/api/mood-logs/someone-elses-log")
      .set("Authorization", authHeader)
      .send({ moodScore: 3 });

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ error: { code: "NOT_FOUND" } });
  });
});

describe("DELETE /api/mood-logs/:id", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("deletes an owned log and returns 204", async () => {
    vi.mocked(deleteMoodLog).mockResolvedValue(undefined);

    const res = await request(app).delete("/api/mood-logs/log-1").set("Authorization", authHeader);

    expect(res.status).toBe(204);
    expect(deleteMoodLog).toHaveBeenCalledWith("user-1", "log-1");
  });

  it("returns 404 for a cross-user access attempt", async () => {
    vi.mocked(deleteMoodLog).mockRejectedValue(new NotFoundError("Resource not found"));

    const res = await request(app)
      .delete("/api/mood-logs/someone-elses-log")
      .set("Authorization", authHeader);

    expect(res.status).toBe(404);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../services/habit.service.js", () => ({
  listHabits: vi.fn(),
  createHabit: vi.fn(),
}));
vi.mock("../services/habitLog.service.js", () => ({
  listHabitLogs: vi.fn(),
  createHabitLog: vi.fn(),
  updateHabitLog: vi.fn(),
  deleteHabitLog: vi.fn(),
}));

import { listHabits, createHabit } from "../services/habit.service.js";
import {
  listHabitLogs,
  createHabitLog,
  updateHabitLog,
  deleteHabitLog,
} from "../services/habitLog.service.js";
import { NotFoundError, BadRequestError } from "../lib/errors.js";
import { signAccessToken } from "../services/tokenService.js";
import { app } from "../app.js";

const token = signAccessToken({ sub: "user-1" });
const authHeader = `Bearer ${token}`;

describe("habit routes auth requirement", () => {
  it("returns 401 without a bearer token", async () => {
    const res = await request(app).get("/api/habits");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/habits", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns the caller's visible habits", async () => {
    vi.mocked(listHabits).mockResolvedValue([{ id: "habit-1" }] as never);

    const res = await request(app).get("/api/habits").set("Authorization", authHeader);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ habits: [{ id: "habit-1" }] });
    expect(listHabits).toHaveBeenCalledWith("user-1");
  });
});

describe("POST /api/habits", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("creates a habit for a valid body", async () => {
    vi.mocked(createHabit).mockResolvedValue({ id: "habit-1" } as never);

    const res = await request(app)
      .post("/api/habits")
      .set("Authorization", authHeader)
      .send({ name: "Drink water", trackingType: "numeric", unit: "glasses" });

    expect(res.status).toBe(201);
    expect(createHabit).toHaveBeenCalledWith("user-1", {
      name: "Drink water",
      trackingType: "numeric",
      unit: "glasses",
    });
  });

  it("returns 400 and does not call the service for a missing name", async () => {
    const res = await request(app)
      .post("/api/habits")
      .set("Authorization", authHeader)
      .send({ trackingType: "numeric" });

    expect(res.status).toBe(400);
    expect(createHabit).not.toHaveBeenCalled();
  });

  it("returns 400 and does not call the service for an invalid trackingType", async () => {
    const res = await request(app)
      .post("/api/habits")
      .set("Authorization", authHeader)
      .send({ name: "Drink water", trackingType: "not-a-type" });

    expect(res.status).toBe(400);
    expect(createHabit).not.toHaveBeenCalled();
  });
});

describe("GET /api/habit-logs", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns the paginated result for a valid query", async () => {
    vi.mocked(listHabitLogs).mockResolvedValue({ items: [], total: 0 });

    const res = await request(app)
      .get("/api/habit-logs")
      .query({ limit: "10", offset: "0" })
      .set("Authorization", authHeader);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [], total: 0 });
    expect(listHabitLogs).toHaveBeenCalledWith("user-1", { limit: 10, offset: 0 });
  });

  it("returns 400 for an invalid query string", async () => {
    const res = await request(app)
      .get("/api/habit-logs")
      .query({ limit: "not-a-number" })
      .set("Authorization", authHeader);

    expect(res.status).toBe(400);
    expect(listHabitLogs).not.toHaveBeenCalled();
  });
});

describe("POST /api/habit-logs", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const validBody = {
    habitId: "123e4567-e89b-12d3-a456-426614174000",
    valueNumeric: 3,
  };

  it("creates a log for a valid body", async () => {
    vi.mocked(createHabitLog).mockResolvedValue({ id: "log-1" } as never);

    const res = await request(app)
      .post("/api/habit-logs")
      .set("Authorization", authHeader)
      .send(validBody);

    expect(res.status).toBe(201);
    expect(createHabitLog).toHaveBeenCalledWith("user-1", validBody);
  });

  it("returns 400 and does not call the service for a non-UUID habitId", async () => {
    const res = await request(app)
      .post("/api/habit-logs")
      .set("Authorization", authHeader)
      .send({ habitId: "not-a-uuid", valueNumeric: 3 });

    expect(res.status).toBe(400);
    expect(createHabitLog).not.toHaveBeenCalled();
  });

  it("returns 404 when the service rejects with NotFoundError for an unreachable habit", async () => {
    vi.mocked(createHabitLog).mockRejectedValue(new NotFoundError("Habit not found"));

    const res = await request(app)
      .post("/api/habit-logs")
      .set("Authorization", authHeader)
      .send(validBody);

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ error: { code: "NOT_FOUND" } });
  });

  it("returns 400 when the service rejects with BadRequestError for a wrong value field", async () => {
    vi.mocked(createHabitLog).mockRejectedValue(
      new BadRequestError(
        "valueBoolean is required for a boolean habit",
        "INVALID_HABIT_LOG_VALUE",
      ),
    );

    const res = await request(app)
      .post("/api/habit-logs")
      .set("Authorization", authHeader)
      .send(validBody);

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: { code: "INVALID_HABIT_LOG_VALUE" } });
  });
});

describe("PATCH /api/habit-logs/:id", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("updates a log for a valid body", async () => {
    vi.mocked(updateHabitLog).mockResolvedValue({ id: "log-1", valueNumeric: 4 } as never);

    const res = await request(app)
      .patch("/api/habit-logs/log-1")
      .set("Authorization", authHeader)
      .send({ valueNumeric: 4 });

    expect(res.status).toBe(200);
    expect(updateHabitLog).toHaveBeenCalledWith("user-1", "log-1", { valueNumeric: 4 });
  });

  it("returns 404 for a cross-user access attempt", async () => {
    vi.mocked(updateHabitLog).mockRejectedValue(new NotFoundError("Resource not found"));

    const res = await request(app)
      .patch("/api/habit-logs/someone-elses-log")
      .set("Authorization", authHeader)
      .send({ valueNumeric: 4 });

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ error: { code: "NOT_FOUND" } });
  });

  it("returns 404 for an unreachable/hidden habitId reference during re-validation", async () => {
    vi.mocked(updateHabitLog).mockRejectedValue(new NotFoundError("Habit not found"));

    const res = await request(app)
      .patch("/api/habit-logs/log-1")
      .set("Authorization", authHeader)
      .send({ valueNumeric: 4 });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/habit-logs/:id", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("deletes an owned log and returns 204", async () => {
    vi.mocked(deleteHabitLog).mockResolvedValue(undefined);

    const res = await request(app).delete("/api/habit-logs/log-1").set("Authorization", authHeader);

    expect(res.status).toBe(204);
    expect(deleteHabitLog).toHaveBeenCalledWith("user-1", "log-1");
  });

  it("returns 404 for a cross-user access attempt", async () => {
    vi.mocked(deleteHabitLog).mockRejectedValue(new NotFoundError("Resource not found"));

    const res = await request(app)
      .delete("/api/habit-logs/someone-elses-log")
      .set("Authorization", authHeader);

    expect(res.status).toBe(404);
  });
});

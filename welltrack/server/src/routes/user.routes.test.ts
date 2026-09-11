import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../services/user.service.js", () => ({
  getUserStats: vi.fn(),
}));

import { getUserStats } from "../services/user.service.js";
import { UnauthorizedError } from "../lib/errors.js";
import { signAccessToken } from "../services/tokenService.js";
import { app } from "../app.js";

const token = signAccessToken({ sub: "user-1" });
const authHeader = `Bearer ${token}`;

const stats = {
  averageMoodScoreLast30Days: 3.5,
  topSymptoms: [{ symptomId: "s1", name: "Headache", count: 4 }],
  currentStreakDays: 6,
  totalLogsByType: { symptom: 10, mood: 8, medication: 2, habit: 5 },
};

describe("GET /api/stats", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 without a bearer token", async () => {
    const res = await request(app).get("/api/stats");
    expect(res.status).toBe(401);
    expect(getUserStats).not.toHaveBeenCalled();
  });

  it("returns 200 with the caller's aggregated stats", async () => {
    vi.mocked(getUserStats).mockResolvedValue(stats);

    const res = await request(app).get("/api/stats").set("Authorization", authHeader);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(stats);
    expect(getUserStats).toHaveBeenCalledWith("user-1");
  });

  it("propagates a service error through the centralized error handler", async () => {
    vi.mocked(getUserStats).mockRejectedValue(
      new UnauthorizedError("User not found", "USER_NOT_FOUND"),
    );

    const res = await request(app).get("/api/stats").set("Authorization", authHeader);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: { code: "USER_NOT_FOUND", message: "User not found" } });
  });
});

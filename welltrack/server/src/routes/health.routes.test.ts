import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../services/health.service.js", () => ({
  checkDatabaseConnection: vi.fn(),
}));

import { checkDatabaseConnection } from "../services/health.service.js";
import { app } from "../app.js";

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 200 with database: connected when the DB check resolves true", async () => {
    vi.mocked(checkDatabaseConnection).mockResolvedValue(true);

    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "ok", database: "connected" });
    expect(res.body.timestamp).toEqual(expect.any(String));
  });

  it("returns 200 with database: unreachable when the DB check resolves false", async () => {
    vi.mocked(checkDatabaseConnection).mockResolvedValue(false);

    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "ok", database: "unreachable" });
  });

  it("returns 200 with database: unreachable when the DB check rejects", async () => {
    vi.mocked(checkDatabaseConnection).mockRejectedValue(new Error("ECONNREFUSED"));

    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "ok", database: "unreachable" });
  });
});

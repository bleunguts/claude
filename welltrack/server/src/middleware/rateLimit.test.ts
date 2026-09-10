import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { createAuthRateLimiter } from "./rateLimit.js";

describe("createAuthRateLimiter", () => {
  it("allows requests under the limit and blocks once the limit is exceeded", async () => {
    const app = express();
    app.post("/test", createAuthRateLimiter({ windowMs: 60_000, limit: 2 }), (_req, res) => {
      res.status(200).json({ ok: true });
    });

    const first = await request(app).post("/test");
    const second = await request(app).post("/test");
    const third = await request(app).post("/test");

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
    expect(third.body).toMatchObject({ error: { code: "TOO_MANY_REQUESTS" } });
  });
});

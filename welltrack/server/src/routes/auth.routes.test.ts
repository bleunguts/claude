import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../services/auth.service.js", () => ({
  register: vi.fn(),
}));

import { register } from "../services/auth.service.js";
import { ConflictError } from "../lib/errors.js";
import { app } from "../app.js";

const validBody = {
  email: "user@example.com",
  password: "hunter2pass",
  displayName: "User",
};

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 201 with the created user and tokens for a valid request", async () => {
    const authResult = {
      user: {
        id: "user-id",
        email: "user@example.com",
        displayName: "User",
        timezone: "UTC",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      accessToken: "access-token",
      refreshToken: "refresh-token",
    };
    vi.mocked(register).mockResolvedValue(authResult);

    const res = await request(app).post("/api/auth/register").send(validBody);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      ...authResult,
      user: { ...authResult.user, createdAt: authResult.user.createdAt.toISOString() },
    });
    expect(register).toHaveBeenCalledWith(validBody);
  });

  it("returns 409 when the service rejects with ConflictError", async () => {
    vi.mocked(register).mockRejectedValue(new ConflictError("Email is already registered"));

    const res = await request(app).post("/api/auth/register").send(validBody);

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ error: { code: "EMAIL_IN_USE" } });
  });

  it("returns 400 and does not call the service for an invalid email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validBody, email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(register).not.toHaveBeenCalled();
  });

  it("returns 400 and does not call the service for a weak password", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validBody, password: "alllowercase" });

    expect(res.status).toBe(400);
    expect(register).not.toHaveBeenCalled();
  });

  it("returns 400 and does not call the service for a short password", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...validBody, password: "abc1" });

    expect(res.status).toBe(400);
    expect(register).not.toHaveBeenCalled();
  });

  it("returns 400 and does not call the service for a missing display name", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: validBody.email, password: validBody.password, displayName: "" });

    expect(res.status).toBe(400);
    expect(register).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../services/auth.service.js", () => ({
  register: vi.fn(),
  login: vi.fn(),
  refresh: vi.fn(),
  logout: vi.fn(),
  requestPasswordReset: vi.fn(),
  applyPasswordReset: vi.fn(),
}));

import {
  register,
  login,
  refresh,
  logout,
  requestPasswordReset,
  applyPasswordReset,
} from "../services/auth.service.js";
import { BadRequestError, ConflictError, UnauthorizedError } from "../lib/errors.js";
import { app } from "../app.js";

const validBody = {
  email: "user@example.com",
  password: "hunter2pass",
  displayName: "User",
};

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

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 201 with the created user and tokens for a valid request", async () => {
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
    vi.mocked(register).mockRejectedValue(
      new ConflictError("Email is already registered", "EMAIL_IN_USE"),
    );

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

describe("POST /api/auth/login", () => {
  const loginBody = { email: "user@example.com", password: "hunter2pass" };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 200 with the user and tokens for valid credentials", async () => {
    vi.mocked(login).mockResolvedValue(authResult);

    const res = await request(app).post("/api/auth/login").send(loginBody);

    expect(res.status).toBe(200);
    expect(login).toHaveBeenCalledWith(loginBody);
  });

  it("returns 401 with a generic message when the service rejects with UnauthorizedError", async () => {
    vi.mocked(login).mockRejectedValue(
      new UnauthorizedError("Invalid email or password", "INVALID_CREDENTIALS"),
    );

    const res = await request(app).post("/api/auth/login").send(loginBody);

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
    });
  });

  it("returns 400 and does not call the service for a missing password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: loginBody.email, password: "" });

    expect(res.status).toBe(400);
    expect(login).not.toHaveBeenCalled();
  });
});

describe("POST /api/auth/refresh", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 200 with a fresh token pair for a valid refresh token", async () => {
    vi.mocked(refresh).mockResolvedValue(authResult);

    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: "raw-refresh-token" });

    expect(res.status).toBe(200);
    expect(refresh).toHaveBeenCalledWith("raw-refresh-token");
  });

  it("returns 401 when the service rejects with UnauthorizedError", async () => {
    vi.mocked(refresh).mockRejectedValue(
      new UnauthorizedError("Invalid or expired refresh token", "INVALID_REFRESH_TOKEN"),
    );

    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: "revoked-token" });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ error: { code: "INVALID_REFRESH_TOKEN" } });
  });

  it("returns 400 and does not call the service when refreshToken is missing", async () => {
    const res = await request(app).post("/api/auth/refresh").send({});

    expect(res.status).toBe(400);
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 204 and revokes the presented refresh token", async () => {
    vi.mocked(logout).mockResolvedValue(undefined);

    const res = await request(app)
      .post("/api/auth/logout")
      .send({ refreshToken: "raw-refresh-token" });

    expect(res.status).toBe(204);
    expect(logout).toHaveBeenCalledWith("raw-refresh-token");
  });

  it("returns 400 and does not call the service when refreshToken is missing", async () => {
    const res = await request(app).post("/api/auth/logout").send({});

    expect(res.status).toBe(400);
    expect(logout).not.toHaveBeenCalled();
  });
});

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 200 for a known email", async () => {
    vi.mocked(requestPasswordReset).mockResolvedValue(undefined);

    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "user@example.com" });

    expect(res.status).toBe(200);
    expect(requestPasswordReset).toHaveBeenCalledWith("user@example.com");
  });

  it("returns the same 200 response for an unknown email", async () => {
    vi.mocked(requestPasswordReset).mockResolvedValue(undefined);

    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "nobody@example.com" });

    expect(res.status).toBe(200);
  });

  it("returns 400 and does not call the service for an invalid email", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(requestPasswordReset).not.toHaveBeenCalled();
  });
});

describe("POST /api/auth/reset-password", () => {
  const resetBody = { token: "raw-reset-token", newPassword: "newhunter2pass" };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 200 and resets the password for a valid token", async () => {
    vi.mocked(applyPasswordReset).mockResolvedValue(undefined);

    const res = await request(app).post("/api/auth/reset-password").send(resetBody);

    expect(res.status).toBe(200);
    expect(applyPasswordReset).toHaveBeenCalledWith(resetBody);
  });

  it("returns 400 when the service rejects with BadRequestError", async () => {
    vi.mocked(applyPasswordReset).mockRejectedValue(
      new BadRequestError("Invalid or expired reset token", "INVALID_RESET_TOKEN"),
    );

    const res = await request(app).post("/api/auth/reset-password").send(resetBody);

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: { code: "INVALID_RESET_TOKEN" } });
  });

  it("returns 400 and does not call the service for a weak new password", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ ...resetBody, newPassword: "short" });

    expect(res.status).toBe(400);
    expect(applyPasswordReset).not.toHaveBeenCalled();
  });
});

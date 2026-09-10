import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";

vi.mock("../services/tokenService.js", () => ({
  verifyAccessToken: vi.fn(),
}));

import { verifyAccessToken } from "../services/tokenService.js";
import { requireAuth } from "./requireAuth.js";

function fakeRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

describe("requireAuth", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 401 when no Authorization header is present", () => {
    const req = { headers: {} } as Request;
    const res = fakeRes();
    const next = vi.fn() as NextFunction;

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
    expect(verifyAccessToken).not.toHaveBeenCalled();
  });

  it("returns 401 when the header is not a Bearer token", () => {
    const req = { headers: { authorization: "Basic abc123" } } as Request;
    const res = fakeRes();
    const next = vi.fn() as NextFunction;

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when the token fails verification", () => {
    vi.mocked(verifyAccessToken).mockImplementation(() => {
      throw new Error("invalid token");
    });
    const req = { headers: { authorization: "Bearer bad-token" } } as Request;
    const res = fakeRes();
    const next = vi.fn() as NextFunction;

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("attaches userId and calls next for a valid token", () => {
    vi.mocked(verifyAccessToken).mockReturnValue({ sub: "user-123" });
    const req = { headers: { authorization: "Bearer good-token" } } as Request;
    const res = fakeRes();
    const next = vi.fn() as NextFunction;

    requireAuth(req, res, next);

    expect(req.userId).toBe("user-123");
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});

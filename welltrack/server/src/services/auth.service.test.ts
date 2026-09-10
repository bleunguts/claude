import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./passwordService.js", () => ({
  hash: vi.fn(),
}));
vi.mock("./tokenService.js", () => ({
  signAccessToken: vi.fn(),
  generateRefreshToken: vi.fn(),
  hashRefreshToken: vi.fn(),
  getRefreshTokenExpiresAt: vi.fn(),
}));

import * as passwordService from "./passwordService.js";
import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiresAt,
} from "./tokenService.js";
import { register } from "./auth.service.js";
import { ConflictError } from "../lib/errors.js";
import type { PrismaClient } from "../generated/prisma/client.js";

function fakePrisma() {
  return {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
    },
  } as unknown as PrismaClient & {
    user: { findUnique: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
    refreshToken: { create: ReturnType<typeof vi.fn> };
  };
}

const input = { email: "user@example.com", password: "hunter2pass", displayName: "User" };

describe("auth.service register", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("throws ConflictError when the email is already registered", async () => {
    const client = fakePrisma();
    client.user.findUnique.mockResolvedValue({ id: "existing-user" });

    await expect(register(input, client)).rejects.toBeInstanceOf(ConflictError);
    expect(client.user.create).not.toHaveBeenCalled();
  });

  it("hashes the password, creates the user, and issues a token pair", async () => {
    const client = fakePrisma();
    client.user.findUnique.mockResolvedValue(null);
    vi.mocked(passwordService.hash).mockResolvedValue("hashed-password");
    client.user.create.mockResolvedValue({
      id: "new-user-id",
      email: "user@example.com",
      passwordHash: "hashed-password",
      displayName: "User",
      timezone: "UTC",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    vi.mocked(signAccessToken).mockReturnValue("access-token");
    vi.mocked(generateRefreshToken).mockReturnValue("raw-refresh-token");
    vi.mocked(hashRefreshToken).mockReturnValue("hashed-refresh-token");
    const expiresAt = new Date("2026-02-01T00:00:00.000Z");
    vi.mocked(getRefreshTokenExpiresAt).mockReturnValue(expiresAt);

    const result = await register(input, client);

    expect(passwordService.hash).toHaveBeenCalledWith("hunter2pass");
    expect(client.user.create).toHaveBeenCalledWith({
      data: { email: "user@example.com", passwordHash: "hashed-password", displayName: "User" },
    });
    expect(client.refreshToken.create).toHaveBeenCalledWith({
      data: { userId: "new-user-id", tokenHash: "hashed-refresh-token", expiresAt },
    });
    expect(result).toEqual({
      user: {
        id: "new-user-id",
        email: "user@example.com",
        displayName: "User",
        timezone: "UTC",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      accessToken: "access-token",
      refreshToken: "raw-refresh-token",
    });
    expect(result.user).not.toHaveProperty("passwordHash");
  });
});

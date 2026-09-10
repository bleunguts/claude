import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./passwordService.js", () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));
vi.mock("./tokenService.js", () => ({
  signAccessToken: vi.fn(),
  generateRefreshToken: vi.fn(),
  hashRefreshToken: vi.fn(),
  getRefreshTokenExpiresAt: vi.fn(),
  generateResetToken: vi.fn(),
  hashResetToken: vi.fn(),
  getResetTokenExpiresAt: vi.fn(),
}));
vi.mock("./emailService.js", () => ({
  sendPasswordResetEmail: vi.fn(),
}));
vi.mock("../config/index.js", () => ({
  config: { CLIENT_URL: "https://app.example.com" },
}));

import * as passwordService from "./passwordService.js";
import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiresAt,
  generateResetToken,
  hashResetToken,
  getResetTokenExpiresAt,
} from "./tokenService.js";
import { sendPasswordResetEmail } from "./emailService.js";
import {
  register,
  login,
  refresh,
  logout,
  requestPasswordReset,
  applyPasswordReset,
} from "./auth.service.js";
import { BadRequestError, ConflictError, UnauthorizedError } from "../lib/errors.js";
import type { PrismaClient } from "../generated/prisma/client.js";

function fakePrisma() {
  return {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    passwordResetToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
  } as unknown as PrismaClient & {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    refreshToken: {
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      updateMany: ReturnType<typeof vi.fn>;
    };
    passwordResetToken: {
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    $transaction: ReturnType<typeof vi.fn>;
  };
}

const registerInput = { email: "user@example.com", password: "hunter2pass", displayName: "User" };
const existingUser = {
  id: "existing-user-id",
  email: "user@example.com",
  passwordHash: "hashed-password",
  displayName: "User",
  timezone: "UTC",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("auth.service register", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("throws ConflictError when the email is already registered", async () => {
    const client = fakePrisma();
    client.user.findUnique.mockResolvedValue({ id: "existing-user" });

    await expect(register(registerInput, client)).rejects.toBeInstanceOf(ConflictError);
    expect(client.user.create).not.toHaveBeenCalled();
  });

  it("hashes the password, creates the user, and issues a token pair", async () => {
    const client = fakePrisma();
    client.user.findUnique.mockResolvedValue(null);
    vi.mocked(passwordService.hash).mockResolvedValue("hashed-password");
    client.user.create.mockResolvedValue(existingUser);
    vi.mocked(signAccessToken).mockReturnValue("access-token");
    vi.mocked(generateRefreshToken).mockReturnValue("raw-refresh-token");
    vi.mocked(hashRefreshToken).mockReturnValue("hashed-refresh-token");
    const expiresAt = new Date("2026-02-01T00:00:00.000Z");
    vi.mocked(getRefreshTokenExpiresAt).mockReturnValue(expiresAt);

    const result = await register(registerInput, client);

    expect(passwordService.hash).toHaveBeenCalledWith("hunter2pass");
    expect(client.user.create).toHaveBeenCalledWith({
      data: { email: "user@example.com", passwordHash: "hashed-password", displayName: "User" },
    });
    expect(client.refreshToken.create).toHaveBeenCalledWith({
      data: { userId: "existing-user-id", tokenHash: "hashed-refresh-token", expiresAt },
    });
    expect(result).toEqual({
      user: {
        id: "existing-user-id",
        email: "user@example.com",
        displayName: "User",
        timezone: "UTC",
        createdAt: existingUser.createdAt,
      },
      accessToken: "access-token",
      refreshToken: "raw-refresh-token",
    });
    expect(result.user).not.toHaveProperty("passwordHash");
  });
});

describe("auth.service login", () => {
  const loginInput = { email: "user@example.com", password: "hunter2pass" };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(signAccessToken).mockReturnValue("access-token");
    vi.mocked(generateRefreshToken).mockReturnValue("raw-refresh-token");
    vi.mocked(hashRefreshToken).mockReturnValue("hashed-refresh-token");
    vi.mocked(getRefreshTokenExpiresAt).mockReturnValue(new Date("2026-02-01T00:00:00.000Z"));
  });

  it("throws UnauthorizedError when the email is not found", async () => {
    const client = fakePrisma();
    client.user.findUnique.mockResolvedValue(null);

    await expect(login(loginInput, client)).rejects.toBeInstanceOf(UnauthorizedError);
    expect(passwordService.compare).not.toHaveBeenCalled();
  });

  it("throws UnauthorizedError with the same message when the password is wrong", async () => {
    const client = fakePrisma();
    client.user.findUnique.mockResolvedValue(existingUser);
    vi.mocked(passwordService.compare).mockResolvedValue(false);

    await expect(login(loginInput, client)).rejects.toMatchObject({
      message: "Invalid email or password",
    });
  });

  it("issues a token pair for valid credentials", async () => {
    const client = fakePrisma();
    client.user.findUnique.mockResolvedValue(existingUser);
    vi.mocked(passwordService.compare).mockResolvedValue(true);

    const result = await login(loginInput, client);

    expect(passwordService.compare).toHaveBeenCalledWith("hunter2pass", "hashed-password");
    expect(result.accessToken).toBe("access-token");
    expect(result.refreshToken).toBe("raw-refresh-token");
    expect(result.user.id).toBe("existing-user-id");
  });
});

describe("auth.service refresh", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(hashRefreshToken).mockReturnValue("hashed-refresh-token");
    vi.mocked(signAccessToken).mockReturnValue("new-access-token");
    vi.mocked(generateRefreshToken).mockReturnValue("new-raw-refresh-token");
    vi.mocked(getRefreshTokenExpiresAt).mockReturnValue(new Date("2026-03-01T00:00:00.000Z"));
  });

  it("throws UnauthorizedError when the token does not exist", async () => {
    const client = fakePrisma();
    client.refreshToken.findUnique.mockResolvedValue(null);

    await expect(refresh("raw-token", client)).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("throws UnauthorizedError when the token is already revoked", async () => {
    const client = fakePrisma();
    client.refreshToken.findUnique.mockResolvedValue({
      id: "token-id",
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 100_000),
      user: existingUser,
    });

    await expect(refresh("raw-token", client)).rejects.toBeInstanceOf(UnauthorizedError);
    expect(client.refreshToken.update).not.toHaveBeenCalled();
  });

  it("throws UnauthorizedError when the token is expired", async () => {
    const client = fakePrisma();
    client.refreshToken.findUnique.mockResolvedValue({
      id: "token-id",
      revokedAt: null,
      expiresAt: new Date(Date.now() - 1000),
      user: existingUser,
    });

    await expect(refresh("raw-token", client)).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("revokes the old token and issues a new pair for a valid token", async () => {
    const client = fakePrisma();
    client.refreshToken.findUnique.mockResolvedValue({
      id: "token-id",
      revokedAt: null,
      expiresAt: new Date(Date.now() + 100_000),
      user: existingUser,
    });

    const result = await refresh("raw-token", client);

    expect(client.refreshToken.update).toHaveBeenCalledWith({
      where: { id: "token-id" },
      data: { revokedAt: expect.any(Date) },
    });
    expect(client.refreshToken.create).toHaveBeenCalledWith({
      data: {
        userId: "existing-user-id",
        tokenHash: "hashed-refresh-token",
        expiresAt: new Date("2026-03-01T00:00:00.000Z"),
      },
    });
    expect(result.accessToken).toBe("new-access-token");
    expect(result.refreshToken).toBe("new-raw-refresh-token");
  });
});

describe("auth.service logout", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(hashRefreshToken).mockReturnValue("hashed-refresh-token");
  });

  it("revokes the matching, not-yet-revoked refresh token", async () => {
    const client = fakePrisma();

    await logout("raw-token", client);

    expect(client.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { tokenHash: "hashed-refresh-token", revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it("does not throw when the token does not match any row", async () => {
    const client = fakePrisma();
    client.refreshToken.updateMany.mockResolvedValue({ count: 0 });

    await expect(logout("unknown-token", client)).resolves.toBeUndefined();
  });
});

describe("auth.service requestPasswordReset", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(generateResetToken).mockReturnValue("raw-reset-token");
    vi.mocked(hashResetToken).mockReturnValue("hashed-reset-token");
    vi.mocked(getResetTokenExpiresAt).mockReturnValue(new Date("2026-01-01T01:00:00.000Z"));
  });

  it("does nothing and does not send an email when the email is unknown", async () => {
    const client = fakePrisma();
    client.user.findUnique.mockResolvedValue(null);

    await requestPasswordReset("nobody@example.com", client);

    expect(client.passwordResetToken.create).not.toHaveBeenCalled();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("creates a reset token and emails the user when the email is known", async () => {
    const client = fakePrisma();
    client.user.findUnique.mockResolvedValue(existingUser);

    await requestPasswordReset("user@example.com", client);

    expect(client.passwordResetToken.create).toHaveBeenCalledWith({
      data: {
        userId: "existing-user-id",
        tokenHash: "hashed-reset-token",
        expiresAt: new Date("2026-01-01T01:00:00.000Z"),
      },
    });
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      "user@example.com",
      "https://app.example.com/reset-password?token=raw-reset-token",
    );
  });
});

describe("auth.service applyPasswordReset", () => {
  const resetInput = { token: "raw-reset-token", newPassword: "newhunter2pass" };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(hashResetToken).mockReturnValue("hashed-reset-token");
  });

  it("throws BadRequestError when the token does not exist", async () => {
    const client = fakePrisma();
    client.passwordResetToken.findUnique.mockResolvedValue(null);

    await expect(applyPasswordReset(resetInput, client)).rejects.toBeInstanceOf(BadRequestError);
  });

  it("throws BadRequestError when the token was already used", async () => {
    const client = fakePrisma();
    client.passwordResetToken.findUnique.mockResolvedValue({
      id: "reset-id",
      userId: "existing-user-id",
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 100_000),
    });

    await expect(applyPasswordReset(resetInput, client)).rejects.toBeInstanceOf(BadRequestError);
  });

  it("throws BadRequestError when the token is expired", async () => {
    const client = fakePrisma();
    client.passwordResetToken.findUnique.mockResolvedValue({
      id: "reset-id",
      userId: "existing-user-id",
      usedAt: null,
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(applyPasswordReset(resetInput, client)).rejects.toBeInstanceOf(BadRequestError);
  });

  it("updates the password, marks the token used, and revokes refresh tokens", async () => {
    const client = fakePrisma();
    client.passwordResetToken.findUnique.mockResolvedValue({
      id: "reset-id",
      userId: "existing-user-id",
      usedAt: null,
      expiresAt: new Date(Date.now() + 100_000),
    });
    vi.mocked(passwordService.hash).mockResolvedValue("new-hashed-password");

    await applyPasswordReset(resetInput, client);

    expect(passwordService.hash).toHaveBeenCalledWith("newhunter2pass");
    expect(client.user.update).toHaveBeenCalledWith({
      where: { id: "existing-user-id" },
      data: { passwordHash: "new-hashed-password" },
    });
    expect(client.passwordResetToken.update).toHaveBeenCalledWith({
      where: { id: "reset-id" },
      data: { usedAt: expect.any(Date) },
    });
    expect(client.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: "existing-user-id", revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(client.$transaction).toHaveBeenCalledOnce();
  });
});

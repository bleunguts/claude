import type { PrismaClient } from "../generated/prisma/client.js";
import { prisma as defaultPrisma } from "../lib/prisma.js";
import { BadRequestError, ConflictError, UnauthorizedError } from "../lib/errors.js";
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
import { config } from "../config/index.js";
import type {
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "../validators/auth.validators.js";

const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password";

export interface AuthResult {
  user: {
    id: string;
    email: string;
    displayName: string;
    timezone: string;
    createdAt: Date;
  };
  accessToken: string;
  refreshToken: string;
}

interface UserRecord {
  id: string;
  email: string;
  displayName: string;
  timezone: string;
  createdAt: Date;
}

async function issueAuthResult(user: UserRecord, client: PrismaClient): Promise<AuthResult> {
  const accessToken = signAccessToken({ sub: user.id });
  const refreshToken = generateRefreshToken();

  await client.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: getRefreshTokenExpiresAt(),
    },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      timezone: user.timezone,
      createdAt: user.createdAt,
    },
    accessToken,
    refreshToken,
  };
}

export async function register(
  input: RegisterInput,
  client: PrismaClient = defaultPrisma,
): Promise<AuthResult> {
  const existing = await client.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ConflictError("Email is already registered", "EMAIL_IN_USE");
  }

  const passwordHash = await passwordService.hash(input.password);

  const user = await client.user.create({
    data: { email: input.email, passwordHash, displayName: input.displayName },
  });

  return issueAuthResult(user, client);
}

export async function login(
  input: LoginInput,
  client: PrismaClient = defaultPrisma,
): Promise<AuthResult> {
  const user = await client.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE, "INVALID_CREDENTIALS");
  }

  const passwordMatches = await passwordService.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE, "INVALID_CREDENTIALS");
  }

  return issueAuthResult(user, client);
}

export async function refresh(
  refreshToken: string,
  client: PrismaClient = defaultPrisma,
): Promise<AuthResult> {
  const tokenHash = hashRefreshToken(refreshToken);
  const existing = await client.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
    throw new UnauthorizedError("Invalid or expired refresh token", "INVALID_REFRESH_TOKEN");
  }

  await client.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date() },
  });

  return issueAuthResult(existing.user, client);
}

export async function logout(
  refreshToken: string,
  client: PrismaClient = defaultPrisma,
): Promise<void> {
  const tokenHash = hashRefreshToken(refreshToken);
  await client.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function requestPasswordReset(
  email: string,
  client: PrismaClient = defaultPrisma,
): Promise<void> {
  const user = await client.user.findUnique({ where: { email } });
  if (!user) {
    return;
  }

  const resetToken = generateResetToken();
  await client.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashResetToken(resetToken),
      expiresAt: getResetTokenExpiresAt(),
    },
  });

  const resetUrl = `${config.CLIENT_URL}/reset-password?token=${resetToken}`;
  await sendPasswordResetEmail(user.email, resetUrl);
}

export async function applyPasswordReset(
  input: ResetPasswordInput,
  client: PrismaClient = defaultPrisma,
): Promise<void> {
  const tokenHash = hashResetToken(input.token);
  const existing = await client.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!existing || existing.usedAt || existing.expiresAt < new Date()) {
    throw new BadRequestError("Invalid or expired reset token", "INVALID_RESET_TOKEN");
  }

  const passwordHash = await passwordService.hash(input.newPassword);

  await client.$transaction([
    client.user.update({ where: { id: existing.userId }, data: { passwordHash } }),
    client.passwordResetToken.update({
      where: { id: existing.id },
      data: { usedAt: new Date() },
    }),
    client.refreshToken.updateMany({
      where: { userId: existing.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
}

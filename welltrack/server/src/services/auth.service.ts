import type { PrismaClient } from "../generated/prisma/client.js";
import { prisma as defaultPrisma } from "../lib/prisma.js";
import { ConflictError } from "../lib/errors.js";
import * as passwordService from "./passwordService.js";
import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiresAt,
} from "./tokenService.js";
import type { RegisterInput } from "../validators/auth.validators.js";

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

export async function register(
  input: RegisterInput,
  client: PrismaClient = defaultPrisma,
): Promise<AuthResult> {
  const existing = await client.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ConflictError("Email is already registered");
  }

  const passwordHash = await passwordService.hash(input.password);

  const user = await client.user.create({
    data: { email: input.email, passwordHash, displayName: input.displayName },
  });

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

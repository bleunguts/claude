import jwt from "jsonwebtoken";
import { randomBytes, createHash } from "node:crypto";
import ms, { type StringValue } from "ms";
import { config } from "../config/index.js";

export interface AccessTokenPayload {
  sub: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT_ACCESS_TTL as StringValue,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, config.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateRefreshToken(): string {
  return randomBytes(64).toString("hex");
}

export function hashRefreshToken(token: string): string {
  return hashToken(token);
}

export function getRefreshTokenExpiresAt(): Date {
  return new Date(Date.now() + ms(config.JWT_REFRESH_TTL as StringValue));
}

export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashResetToken(token: string): string {
  return hashToken(token);
}

export function getResetTokenExpiresAt(): Date {
  return new Date(Date.now() + ms(config.PASSWORD_RESET_TOKEN_TTL as StringValue));
}

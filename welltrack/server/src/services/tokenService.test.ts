import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import ms, { type StringValue } from "ms";
import { config } from "../config/index.js";
import {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiresAt,
  generateResetToken,
  hashResetToken,
  getResetTokenExpiresAt,
} from "./tokenService.js";

describe("tokenService", () => {
  it("signAccessToken produces a JWT that verifies back to the given subject", () => {
    const token = signAccessToken({ sub: "user-123" });

    const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);
    expect(decoded).toMatchObject({ sub: "user-123" });
  });

  it("generateRefreshToken returns a random 128-char hex string", () => {
    const first = generateRefreshToken();
    const second = generateRefreshToken();

    expect(first).toMatch(/^[0-9a-f]{128}$/);
    expect(first).not.toBe(second);
  });

  it("hashRefreshToken is deterministic and differs from the raw token", () => {
    const token = generateRefreshToken();

    const first = hashRefreshToken(token);
    const second = hashRefreshToken(token);

    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(first).not.toBe(token);
  });

  it("getRefreshTokenExpiresAt returns a Date roughly JWT_REFRESH_TTL from now", () => {
    const before = Date.now();
    const expiresAt = getRefreshTokenExpiresAt();
    const expectedDelta = ms(config.JWT_REFRESH_TTL as StringValue);

    const actualDelta = expiresAt.getTime() - before;
    expect(actualDelta).toBeGreaterThan(expectedDelta - 5000);
    expect(actualDelta).toBeLessThan(expectedDelta + 5000);
  });

  it("verifyAccessToken returns the payload for a token signed with the same secret", () => {
    const token = signAccessToken({ sub: "user-123" });

    expect(verifyAccessToken(token)).toMatchObject({ sub: "user-123" });
  });

  it("verifyAccessToken throws for a token signed with a different secret", () => {
    const token = jwt.sign({ sub: "user-123" }, "some-other-secret");

    expect(() => verifyAccessToken(token)).toThrow();
  });

  it("verifyAccessToken throws for an expired token", () => {
    const token = jwt.sign({ sub: "user-123" }, config.JWT_ACCESS_SECRET, { expiresIn: -1 });

    expect(() => verifyAccessToken(token)).toThrow();
  });

  it("generateResetToken returns a random 64-char hex string", () => {
    const first = generateResetToken();
    const second = generateResetToken();

    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(first).not.toBe(second);
  });

  it("hashResetToken is deterministic and differs from the raw token", () => {
    const token = generateResetToken();

    const first = hashResetToken(token);
    const second = hashResetToken(token);

    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(first).not.toBe(token);
  });

  it("getResetTokenExpiresAt returns a Date roughly PASSWORD_RESET_TOKEN_TTL from now", () => {
    const before = Date.now();
    const expiresAt = getResetTokenExpiresAt();
    const expectedDelta = ms(config.PASSWORD_RESET_TOKEN_TTL as StringValue);

    const actualDelta = expiresAt.getTime() - before;
    expect(actualDelta).toBeGreaterThan(expectedDelta - 5000);
    expect(actualDelta).toBeLessThan(expectedDelta + 5000);
  });
});

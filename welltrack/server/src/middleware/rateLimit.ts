import rateLimit, { type Options } from "express-rate-limit";

type RateLimiterOverrides = Partial<Pick<Options, "windowMs" | "limit">>;

export function createAuthRateLimiter(overrides: RateLimiterOverrides = {}) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: {
        code: "TOO_MANY_REQUESTS",
        message: "Too many requests, please try again later",
      },
    },
    ...overrides,
  });
}

export const registerRateLimiter = createAuthRateLimiter();
export const loginRateLimiter = createAuthRateLimiter();
export const forgotPasswordRateLimiter = createAuthRateLimiter();

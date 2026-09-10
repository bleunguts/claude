import { Router } from "express";
import { validate } from "../middleware/validate.js";
import {
  registerRateLimiter,
  loginRateLimiter,
  forgotPasswordRateLimiter,
} from "../middleware/rateLimit.js";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/auth.validators.js";
import {
  registerUser,
  loginUser,
  refreshSession,
  logoutUser,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/auth/register", registerRateLimiter, validate(registerSchema), registerUser);
router.post("/auth/login", loginRateLimiter, validate(loginSchema), loginUser);
router.post("/auth/refresh", validate(refreshSchema), refreshSession);
router.post("/auth/logout", validate(logoutSchema), logoutUser);
router.post(
  "/auth/forgot-password",
  forgotPasswordRateLimiter,
  validate(forgotPasswordSchema),
  forgotPassword,
);
router.post("/auth/reset-password", validate(resetPasswordSchema), resetPassword);

export default router;

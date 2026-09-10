import type { NextFunction, Request, Response } from "express";
import {
  register,
  login,
  refresh,
  logout,
  requestPasswordReset,
  applyPasswordReset,
} from "../services/auth.service.js";
import { BadRequestError, ConflictError, UnauthorizedError } from "../lib/errors.js";

export async function registerUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await register(req.body);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof ConflictError) {
      res.status(409).json({ error: { code: "EMAIL_IN_USE", message: err.message } });
      return;
    }
    next(err);
  }
}

export async function loginUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await login(req.body);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      res.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: err.message } });
      return;
    }
    next(err);
  }
}

export async function refreshSession(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await refresh(req.body.refreshToken);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      res.status(401).json({ error: { code: "INVALID_REFRESH_TOKEN", message: err.message } });
      return;
    }
    next(err);
  }
}

export async function logoutUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await logout(req.body.refreshToken);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await requestPasswordReset(req.body.email);
    res
      .status(200)
      .json({ message: "If that email is registered, a password reset link has been sent" });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await applyPasswordReset(req.body);
    res.status(200).json({ message: "Password has been reset" });
  } catch (err) {
    if (err instanceof BadRequestError) {
      res.status(400).json({ error: { code: "INVALID_RESET_TOKEN", message: err.message } });
      return;
    }
    next(err);
  }
}

import type { NextFunction, Request, Response } from "express";
import { register } from "../services/auth.service.js";
import { ConflictError } from "../lib/errors.js";

export async function registerUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
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

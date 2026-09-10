import type { NextFunction, Request, Response } from "express";
import { getUserStats } from "../services/user.service.js";

export async function getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = await getUserStats(req.userId!);
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
}

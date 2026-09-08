import type { Request, Response } from "express";
import { checkDatabaseConnection } from "../services/health.service.js";

export async function getHealth(_req: Request, res: Response): Promise<void> {
  const isDatabaseConnected = await checkDatabaseConnection().catch(() => false);
  res.status(200).json({
    status: "ok",
    database: isDatabaseConnected ? "connected" : "unreachable",
    timestamp: new Date().toISOString(),
  });
}

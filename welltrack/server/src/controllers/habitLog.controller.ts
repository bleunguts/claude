import type { NextFunction, Request, Response } from "express";
import {
  listHabitLogs,
  createHabitLog,
  updateHabitLog,
  deleteHabitLog,
} from "../services/habitLog.service.js";
import type { HabitLogQuery } from "../validators/habitLog.validators.js";

export async function getHabitLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await listHabitLogs(req.userId!, req.validatedQuery as HabitLogQuery);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function postHabitLog(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const log = await createHabitLog(req.userId!, req.body);
    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
}

export async function patchHabitLog(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const log = await updateHabitLog(req.userId!, req.params.id as string, req.body);
    res.status(200).json(log);
  } catch (err) {
    next(err);
  }
}

export async function deleteHabitLogHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await deleteHabitLog(req.userId!, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

import type { NextFunction, Request, Response } from "express";
import {
  listMoodLogs,
  createMoodLog,
  updateMoodLog,
  deleteMoodLog,
} from "../services/moodLog.service.js";
import type { MoodLogQuery } from "../validators/moodLog.validators.js";

export async function getMoodLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await listMoodLogs(req.userId!, req.validatedQuery as MoodLogQuery);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function postMoodLog(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const log = await createMoodLog(req.userId!, req.body);
    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
}

export async function patchMoodLog(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const log = await updateMoodLog(req.userId!, req.params.id as string, req.body);
    res.status(200).json(log);
  } catch (err) {
    next(err);
  }
}

export async function deleteMoodLogHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await deleteMoodLog(req.userId!, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

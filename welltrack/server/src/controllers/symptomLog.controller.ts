import type { NextFunction, Request, Response } from "express";
import {
  listSymptomLogs,
  createSymptomLog,
  updateSymptomLog,
  deleteSymptomLog,
} from "../services/symptomLog.service.js";
import type { SymptomLogQuery } from "../validators/symptomLog.validators.js";

export async function getSymptomLogs(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await listSymptomLogs(req.userId!, req.validatedQuery as SymptomLogQuery);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function postSymptomLog(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const log = await createSymptomLog(req.userId!, req.body);
    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
}

export async function patchSymptomLog(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const log = await updateSymptomLog(req.userId!, req.params.id as string, req.body);
    res.status(200).json(log);
  } catch (err) {
    next(err);
  }
}

export async function deleteSymptomLogHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await deleteSymptomLog(req.userId!, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

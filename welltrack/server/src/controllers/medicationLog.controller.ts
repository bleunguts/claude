import type { NextFunction, Request, Response } from "express";
import {
  listMedicationLogs,
  createMedicationLog,
  updateMedicationLog,
  deleteMedicationLog,
} from "../services/medicationLog.service.js";
import type { MedicationLogQuery } from "../validators/medicationLog.validators.js";

export async function getMedicationLogs(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await listMedicationLogs(
      req.userId!,
      req.validatedQuery as MedicationLogQuery,
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function postMedicationLog(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const log = await createMedicationLog(req.userId!, req.body);
    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
}

export async function patchMedicationLog(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const log = await updateMedicationLog(req.userId!, req.params.id as string, req.body);
    res.status(200).json(log);
  } catch (err) {
    next(err);
  }
}

export async function deleteMedicationLogHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await deleteMedicationLog(req.userId!, req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

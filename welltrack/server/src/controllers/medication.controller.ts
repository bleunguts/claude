import type { NextFunction, Request, Response } from "express";
import { listMedications, createMedication } from "../services/medication.service.js";

export async function getMedications(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const medications = await listMedications(req.userId!);
    res.status(200).json({ medications });
  } catch (err) {
    next(err);
  }
}

export async function postMedication(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const medication = await createMedication(req.userId!, req.body);
    res.status(201).json(medication);
  } catch (err) {
    next(err);
  }
}

import type { NextFunction, Request, Response } from "express";
import { listSymptoms, createSymptom } from "../services/symptom.service.js";

export async function getSymptoms(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const symptoms = await listSymptoms(req.userId!);
    res.status(200).json({ symptoms });
  } catch (err) {
    next(err);
  }
}

export async function postSymptom(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const symptom = await createSymptom(req.userId!, req.body);
    res.status(201).json(symptom);
  } catch (err) {
    next(err);
  }
}

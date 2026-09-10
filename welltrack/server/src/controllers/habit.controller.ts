import type { NextFunction, Request, Response } from "express";
import { listHabits, createHabit } from "../services/habit.service.js";

export async function getHabits(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const habits = await listHabits(req.userId!);
    res.status(200).json({ habits });
  } catch (err) {
    next(err);
  }
}

export async function postHabit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const habit = await createHabit(req.userId!, req.body);
    res.status(201).json(habit);
  } catch (err) {
    next(err);
  }
}

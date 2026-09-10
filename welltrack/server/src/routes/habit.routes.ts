import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import { validateQuery } from "../middleware/validateQuery.js";
import { createHabitSchema } from "../validators/habit.validators.js";
import {
  createHabitLogSchema,
  updateHabitLogSchema,
  habitLogQuerySchema,
} from "../validators/habitLog.validators.js";
import { getHabits, postHabit } from "../controllers/habit.controller.js";
import {
  getHabitLogs,
  postHabitLog,
  patchHabitLog,
  deleteHabitLogHandler,
} from "../controllers/habitLog.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/habits", getHabits);
router.post("/habits", validate(createHabitSchema), postHabit);

router.get("/habit-logs", validateQuery(habitLogQuerySchema), getHabitLogs);
router.post("/habit-logs", validate(createHabitLogSchema), postHabitLog);
router.patch("/habit-logs/:id", validate(updateHabitLogSchema), patchHabitLog);
router.delete("/habit-logs/:id", deleteHabitLogHandler);

export default router;

import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import { validateQuery } from "../middleware/validateQuery.js";
import {
  createMoodLogSchema,
  updateMoodLogSchema,
  moodLogQuerySchema,
} from "../validators/moodLog.validators.js";
import {
  getMoodLogs,
  postMoodLog,
  patchMoodLog,
  deleteMoodLogHandler,
} from "../controllers/moodLog.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/mood-logs", validateQuery(moodLogQuerySchema), getMoodLogs);
router.post("/mood-logs", validate(createMoodLogSchema), postMoodLog);
router.patch("/mood-logs/:id", validate(updateMoodLogSchema), patchMoodLog);
router.delete("/mood-logs/:id", deleteMoodLogHandler);

export default router;

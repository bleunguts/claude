import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import { validateQuery } from "../middleware/validateQuery.js";
import { createSymptomSchema } from "../validators/symptom.validators.js";
import {
  createSymptomLogSchema,
  updateSymptomLogSchema,
  symptomLogQuerySchema,
} from "../validators/symptomLog.validators.js";
import { getSymptoms, postSymptom } from "../controllers/symptom.controller.js";
import {
  getSymptomLogs,
  postSymptomLog,
  patchSymptomLog,
  deleteSymptomLogHandler,
} from "../controllers/symptomLog.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/symptoms", getSymptoms);
router.post("/symptoms", validate(createSymptomSchema), postSymptom);

router.get("/symptom-logs", validateQuery(symptomLogQuerySchema), getSymptomLogs);
router.post("/symptom-logs", validate(createSymptomLogSchema), postSymptomLog);
router.patch("/symptom-logs/:id", validate(updateSymptomLogSchema), patchSymptomLog);
router.delete("/symptom-logs/:id", deleteSymptomLogHandler);

export default router;

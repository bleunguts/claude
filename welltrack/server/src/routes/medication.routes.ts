import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import { validateQuery } from "../middleware/validateQuery.js";
import { createMedicationSchema } from "../validators/medication.validators.js";
import {
  createMedicationLogSchema,
  updateMedicationLogSchema,
  medicationLogQuerySchema,
} from "../validators/medicationLog.validators.js";
import { getMedications, postMedication } from "../controllers/medication.controller.js";
import {
  getMedicationLogs,
  postMedicationLog,
  patchMedicationLog,
  deleteMedicationLogHandler,
} from "../controllers/medicationLog.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/medications", getMedications);
router.post("/medications", validate(createMedicationSchema), postMedication);

router.get("/medication-logs", validateQuery(medicationLogQuerySchema), getMedicationLogs);
router.post("/medication-logs", validate(createMedicationLogSchema), postMedicationLog);
router.patch("/medication-logs/:id", validate(updateMedicationLogSchema), patchMedicationLog);
router.delete("/medication-logs/:id", deleteMedicationLogHandler);

export default router;

import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { registerSchema } from "../validators/auth.validators.js";
import { registerUser } from "../controllers/auth.controller.js";

const router = Router();

router.post("/auth/register", validate(registerSchema), registerUser);

export default router;

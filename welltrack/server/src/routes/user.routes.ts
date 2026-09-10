import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { getStats } from "../controllers/user.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/stats", getStats);

export default router;

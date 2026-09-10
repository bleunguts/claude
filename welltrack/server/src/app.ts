import express from "express";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import symptomRoutes from "./routes/symptom.routes.js";
import moodLogRoutes from "./routes/moodLog.routes.js";
import habitRoutes from "./routes/habit.routes.js";
import medicationRoutes from "./routes/medication.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.send("WellTrack API");
  });

  app.use("/api", healthRoutes);
  app.use("/api", authRoutes);
  app.use("/api", symptomRoutes);
  app.use("/api", moodLogRoutes);
  app.use("/api", habitRoutes);
  app.use("/api", medicationRoutes);

  app.use(errorHandler);

  return app;
}

export const app = createApp();

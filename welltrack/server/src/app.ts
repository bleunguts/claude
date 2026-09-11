import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import symptomRoutes from "./routes/symptom.routes.js";
import moodLogRoutes from "./routes/moodLog.routes.js";
import habitRoutes from "./routes/habit.routes.js";
import medicationRoutes from "./routes/medication.routes.js";
import userRoutes from "./routes/user.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { config } from "./config/index.js";

export function createApp() {
  const app = express();
  app.use(cors({ origin: config.CLIENT_URL }));
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
  app.use("/api", userRoutes);

  app.use(errorHandler);

  return app;
}

export const app = createApp();

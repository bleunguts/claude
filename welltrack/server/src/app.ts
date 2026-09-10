import express from "express";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.send("WellTrack API");
  });

  app.use("/api", healthRoutes);
  app.use("/api", authRoutes);

  app.use(errorHandler);

  return app;
}

export const app = createApp();

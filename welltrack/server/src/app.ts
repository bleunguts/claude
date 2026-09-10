import express from "express";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.send("WellTrack API");
  });

  app.use("/api", healthRoutes);
  app.use("/api", authRoutes);

  return app;
}

export const app = createApp();

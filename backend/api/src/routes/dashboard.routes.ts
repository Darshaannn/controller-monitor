import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller";

export function createDashboardRouter(controller: DashboardController): Router {
  const router = Router();
  router.get("/dashboard", controller.getDashboard);
  router.get("/telemetry/stream", controller.streamTelemetry);
  return router;
}

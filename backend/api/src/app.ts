import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import {
  TelemetryConfig,
  DEFAULT_TELEMETRY_CONFIG,
} from "./config/telemetry.config";
import { getAppEnvironment } from "./config/env.config";
import { TelemetryStateService } from "./services/telemetry-state.service";
import { TelemetrySimulatorService } from "./services/telemetry-simulator.service";
import { DashboardController } from "./controllers/dashboard.controller";
import { createDashboardRouter } from "./routes/dashboard.routes";
import { notFoundHandler, globalErrorHandler } from "./middleware";
import { AppContext } from "./interfaces";

export { AppContext };

export function createApp(
  config: TelemetryConfig = DEFAULT_TELEMETRY_CONFIG,
): AppContext {
  const app = express();
  const env = getAppEnvironment();

  // Securely restrict CORS origins based on environment
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (Electron desktop shell, curl, server-to-server) or wildcard configured
        if (!origin || env.corsAllowedOrigins.includes("*") || env.corsAllowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("CORS policy violation: unauthorized origin"));
        }
      },
      methods: ["GET", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );
  app.use(express.json());

  // Instantiate domain services
  const stateService = new TelemetryStateService(config);
  const simulatorService = new TelemetrySimulatorService(config, stateService);
  const dashboardController = new DashboardController(stateService);

  // Mount API routes
  app.use("/api", createDashboardRouter(dashboardController));

  // Health & Service info endpoints
  app.get("/", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      service: "controller-monitor-api",
      version: "1.0.0",
      endpoints: {
        health: "/health",
        apiHealth: "/api/health",
        dashboard: "/api/dashboard",
        stream: "/api/telemetry/stream",
      },
    });
  });

  app.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      service: "controller-monitor-api",
    });
  });

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      service: "controller-monitor-api",
      uptime: process.uptime(),
      simulation: {
        running: simulatorService.getIsRunning(),
        phase: simulatorService.getPhase(),
        cycleCount: simulatorService.getCycleCount(),
      },
    });
  });

  // Global 404 handler middleware
  app.use(notFoundHandler);

  // Global exception and error handling middleware
  app.use(globalErrorHandler);

  return { app, stateService, simulatorService };
}

import { Request, Response } from "express";
import { TelemetryStateService } from "../services/telemetry-state.service";

export class DashboardController {
  constructor(private readonly stateService: TelemetryStateService) {}

  getDashboard = (_req: Request, res: Response): void => {
    try {
      const snapshot = this.stateService.getSnapshot();
      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate",
      );
      res.json(snapshot);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Error generating dashboard snapshot:", message);
      res.status(500).json({ error: "Failed to retrieve telemetry snapshot" });
    }
  };

  /**
   * Server-Sent Events (SSE) streaming endpoint: GET /api/telemetry/stream
   * Continuously pushes real-time telemetry snapshots and heartbeats to clients.
   */
  streamTelemetry = (req: Request, res: Response): void => {
    // Set headers required for Server-Sent Events
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable buffering for Nginx/proxies

    // Flush headers immediately if available
    res.flushHeaders?.();

    // 1. Immediately push the current snapshot to the newly connected client
    const initialSnapshot = this.stateService.getSnapshot();
    res.write(`event: snapshot\ndata: ${JSON.stringify(initialSnapshot)}\n\n`);

    // 2. Subscribe to subsequent simulation ticks
    const onSnapshot = (snapshot: unknown) => {
      res.write(`event: snapshot\ndata: ${JSON.stringify(snapshot)}\n\n`);
    };

    this.stateService.on("snapshot", onSnapshot);

    // 3. Keep connection active with 15-second heartbeat comments
    const heartbeatTimer = setInterval(() => {
      res.write(`: heartbeat ${Date.now()}\n\n`);
    }, 15000);

    // 4. Handle client disconnection cleanly to prevent memory leaks
    req.on("close", () => {
      clearInterval(heartbeatTimer);
      this.stateService.off("snapshot", onSnapshot);
      res.end();
    });
  };
}

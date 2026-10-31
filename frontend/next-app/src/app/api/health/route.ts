import { NextResponse } from "next/server";
import { getTelemetryServices } from "@/server/telemetry-service-instance";

export const dynamic = "force-dynamic";

export async function GET() {
  const { simulatorService } = getTelemetryServices();

  return NextResponse.json({
    status: "ok",
    service: "controller-monitor-next-api",
    uptime: process.uptime(),
    simulation: {
      running: simulatorService.getIsRunning(),
      phase: simulatorService.getPhase(),
      cycleCount: simulatorService.getCycleCount(),
    },
  }, {
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  });
}

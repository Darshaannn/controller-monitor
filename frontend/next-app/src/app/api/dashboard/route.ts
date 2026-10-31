import { NextResponse } from "next/server";
import { getTelemetryServices } from "@/server/telemetry-service-instance";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { stateService } = getTelemetryServices();
    const snapshot = stateService.getSnapshot();

    return NextResponse.json(snapshot, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Error generating dashboard snapshot:", message);
    return NextResponse.json(
      { error: "Failed to retrieve telemetry snapshot" },
      { status: 500 },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

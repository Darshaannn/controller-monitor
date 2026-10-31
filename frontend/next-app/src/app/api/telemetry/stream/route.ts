import { getTelemetryServices } from "@/server/telemetry-service-instance";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { stateService } = getTelemetryServices();
  const encoder = new TextEncoder();

  let isClosed = false;

  const stream = new ReadableStream({
    start(controller) {
      // 1. Immediately push the current snapshot upon connection
      try {
        const initialSnapshot = stateService.getSnapshot();
        controller.enqueue(
          encoder.encode(`event: snapshot\ndata: ${JSON.stringify(initialSnapshot)}\n\n`),
        );
      } catch (err) {
        console.error("Error sending initial SSE snapshot:", err);
      }

      // 2. Subscribe to subsequent simulation ticks
      const onSnapshot = (snapshot: unknown) => {
        if (isClosed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: snapshot\ndata: ${JSON.stringify(snapshot)}\n\n`),
          );
        } catch (writeErr) {
          console.error("Error writing SSE snapshot frame:", writeErr);
          cleanup();
        }
      };

      stateService.on("snapshot", onSnapshot);

      // 3. Keep connection active with 15-second heartbeat comments
      const heartbeatTimer = setInterval(() => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
        } catch {
          cleanup();
        }
      }, 15000);

      // 4. Handle client disconnection cleanly to prevent memory leaks
      const cleanup = () => {
        if (isClosed) return;
        isClosed = true;
        clearInterval(heartbeatTimer);
        stateService.off("snapshot", onSnapshot);
        try {
          controller.close();
        } catch {
          // Stream might already be closed
        }
      };

      request.signal.addEventListener("abort", () => {
        cleanup();
      });
    },
    cancel() {
      isClosed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

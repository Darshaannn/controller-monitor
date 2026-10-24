import http from "http";
import { AddressInfo } from "net";
import { createApp } from "./app";
import {
  TelemetryConfig,
  DEFAULT_TELEMETRY_CONFIG,
} from "./config/telemetry.config";
import { TelemetrySimulatorService } from "./services/telemetry-simulator.service";
import { TelemetryStateService } from "./services/telemetry-state.service";
import { getAppEnvironment } from "./config/env.config";
import { ServerInstance } from "./interfaces";

export { ServerInstance };

export function startServer(
  port: number = process.env.PORT ? Number(process.env.PORT) : 3000,
  host: string = process.env.HOST || "0.0.0.0",
  config: TelemetryConfig = DEFAULT_TELEMETRY_CONFIG,
): Promise<ServerInstance> {
  const { app, stateService, simulatorService } = createApp(config);
  const server = http.createServer(app);

  return new Promise((resolve, reject) => {
    server.listen(port, host, () => {
      const address = server.address() as AddressInfo;
      const actualPort = address.port;
      const url = `http://${host}:${actualPort}`;

      // Start independent simulation engine
      simulatorService.start();

      console.log(`Telemetry Express server running at ${url} (port: ${actualPort}, host: ${host})`);

      resolve({
        server,
        port: actualPort,
        url,
        simulatorService,
        stateService,
      });
    });

    server.on("error", (err) => {
      simulatorService.stop();
      reject(err);
    });
  });
}

// Direct invocation handling
if (require.main === module) {
  const env = getAppEnvironment();
  const bindPort = process.env.PORT ? Number(process.env.PORT) : env.port;
  const bindHost = process.env.HOST || (env.nodeEnv === "production" ? "0.0.0.0" : env.host);

  startServer(bindPort, bindHost)
    .then(({ server, simulatorService }) => {
      console.log(
        `Telemetry Express server active in ${env.nodeEnv} mode on ${bindHost}:${bindPort}`,
      );

      const gracefulShutdown = (signal: string) => {
        console.log(`Received ${signal}, shutting down gracefully...`);
        simulatorService.stop();
        server.close(() => {
          console.log("HTTP server closed.");
          process.exit(0);
        });
        setTimeout(() => {
          console.error("Forcing shutdown after timeout.");
          process.exit(1);
        }, 10000).unref();
      };

      process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
      process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    })
    .catch((err) => {
      console.error("Failed to start server:", err);
      process.exit(1);
    });
}


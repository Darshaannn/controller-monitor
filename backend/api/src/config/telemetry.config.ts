import { CANONICAL_BASELINES } from "telemetry-contracts";
import { TelemetryConfig } from "../interfaces";
import { getAppEnvironment } from "./env.config";

export { TelemetryConfig };

export function createTelemetryConfigFromEnv(): TelemetryConfig {
  const env = getAppEnvironment();

  return {
    intervalMs: env.telemetry.intervalMs,
    variationCycles: env.telemetry.variationCycles,
    recoveryCycles: env.telemetry.recoveryCycles,
    recoveryFactor: env.telemetry.recoveryFactor,
    historyCapacity: env.telemetry.historyCapacity,
    variationMaxFraction: env.telemetry.variationMaxFraction,
    baselines: {
      velocity: {
        value: CANONICAL_BASELINES.velocity.value,
        unit: CANONICAL_BASELINES.velocity.unit,
        min: 0,
        max: 1000,
      },
      pressure: {
        value: CANONICAL_BASELINES.pressure.value,
        unit: CANONICAL_BASELINES.pressure.unit,
        min: 0,
        max: 5000,
      },
      temperature: {
        value: CANONICAL_BASELINES.temperature.value,
        unit: CANONICAL_BASELINES.temperature.unit,
        min: -273.15,
        max: 500,
      },
    },
  };
}

export const DEFAULT_TELEMETRY_CONFIG: TelemetryConfig =
  createTelemetryConfigFromEnv();

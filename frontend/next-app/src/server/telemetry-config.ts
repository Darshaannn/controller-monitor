import {
  CANONICAL_BASELINES,
  VelocityUnit,
  PressureUnit,
  TemperatureUnit,
} from "telemetry-contracts";

export interface TelemetryConfig {
  readonly intervalMs: number;
  readonly variationCycles: number;
  readonly recoveryCycles: number;
  readonly recoveryFactor: number;
  readonly historyCapacity: number;
  readonly variationMaxFraction: number;
  readonly baselines: {
    readonly velocity: {
      readonly value: number;
      readonly unit: VelocityUnit;
      readonly min: number;
      readonly max: number;
    };
    readonly pressure: {
      readonly value: number;
      readonly unit: PressureUnit;
      readonly min: number;
      readonly max: number;
    };
    readonly temperature: {
      readonly value: number;
      readonly unit: TemperatureUnit;
      readonly min: number;
      readonly max: number;
    };
  };
}

export function createDefaultTelemetryConfig(): TelemetryConfig {
  const intervalMs = Number(process.env.TELEMETRY_INTERVAL_MS) || 1000;
  const variationCycles = Number(process.env.TELEMETRY_VARIATION_CYCLES) || 5;
  const recoveryCycles = Number(process.env.TELEMETRY_RECOVERY_CYCLES) || 5;
  const recoveryFactor = Number(process.env.TELEMETRY_RECOVERY_FACTOR) || 0.45;
  const historyCapacity = Number(process.env.TELEMETRY_HISTORY_CAPACITY) || 100;
  const variationMaxFraction = Number(process.env.TELEMETRY_VARIATION_MAX_FRACTION) || 0.1;

  return {
    intervalMs,
    variationCycles,
    recoveryCycles,
    recoveryFactor,
    historyCapacity,
    variationMaxFraction,
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

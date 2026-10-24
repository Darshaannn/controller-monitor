import { Express } from "express";
import http from "http";
import { TelemetrySimulatorService } from "../services/telemetry-simulator.service";
import { TelemetryStateService } from "../services/telemetry-state.service";

/**
 * Metric identifiers supported by telemetry
 */
export type MetricKey = "velocity" | "pressure" | "temperature";

/**
 * Measurement Units supported
 */
export type VelocityUnit = "mm/s" | "cm/s" | "m/s" | "km/h" | "ft/s";
export type PressureUnit = "Pa" | "kPa" | "mbar" | "bar" | "psi" | "atm";
export type TemperatureUnit = "°C" | "°F" | "K";
export type MeasurementUnit = VelocityUnit | PressureUnit | TemperatureUnit;

/**
 * Metric status
 */
export type MetricStatus = "normal" | "warning" | "critical";

/**
 * Historical telemetry sample point
 */
export interface TelemetryHistoryPoint {
  readonly time: string; // HH:mm:ss format
  readonly value: number;
  readonly timestamp?: string;
}

/**
 * Metric object definition
 */
export interface TelemetryMetric<TUnit extends string = string> {
  readonly value: number;
  readonly unit: TUnit;
  readonly history: readonly TelemetryHistoryPoint[];
}

/**
 * API Response for GET /api/dashboard
 */
export interface DashboardResponse {
  readonly timestamp: string;
  readonly velocity: TelemetryMetric<VelocityUnit>;
  readonly pressure: TelemetryMetric<PressureUnit>;
  readonly temperature: TelemetryMetric<TemperatureUnit>;
}

/**
 * Internal raw reading from hardware/simulation
 */
export interface TelemetryReading {
  readonly timestamp: Date;
  readonly velocity: number;
  readonly pressure: number;
  readonly temperature: number;
}

/**
 * Simulator configuration model
 */
export interface TelemetryConfig {
  readonly intervalMs: number;
  readonly variationCycles: number;
  readonly recoveryCycles: number;
  readonly recoveryFactor: number;
  readonly historyCapacity: number;
  readonly variationMaxFraction: number; // e.g. 0.10 for +/- 10%
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

/**
 * Application context for dependency injection / service access
 */
export interface AppContext {
  readonly app: Express;
  readonly stateService: TelemetryStateService;
  readonly simulatorService: TelemetrySimulatorService;
}

/**
 * Server instance handle
 */
export interface ServerInstance {
  server: http.Server;
  port: number;
  url: string;
  simulatorService: TelemetrySimulatorService;
  stateService: TelemetryStateService;
}

/**
 * Simulator phase states
 */
export type SimulationPhase = "VARIATION" | "RECOVERY";

export type RandomSource = () => number;
export type ClockSource = () => Date;

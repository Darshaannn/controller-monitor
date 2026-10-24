/**
 * Metric identifiers supported by the telemetry dashboard
 */
export type MetricKey = "velocity" | "pressure" | "temperature";

/**
 * Canonical and display measurement units
 */
export type VelocityUnit = "mm/s" | "cm/s" | "m/s" | "km/h" | "ft/s";
export type PressureUnit = "Pa" | "kPa" | "mbar" | "bar" | "psi" | "atm";
export type TemperatureUnit = "°C" | "°F" | "K";

export type MeasurementUnit = VelocityUnit | PressureUnit | TemperatureUnit;

/**
 * Metric health status based on relative deviation from canonical baseline
 */
export type MetricStatus = "normal" | "warning" | "critical";

/**
 * Application connection states
 */
export type ConnectionStatus = "connected" | "reconnecting" | "offline";

/**
 * Historical telemetry sample point
 */
export interface TelemetryHistoryPoint {
  readonly time: string; // HH:mm:ss format as required by assessment
  readonly value: number;
  readonly timestamp?: string; // Optional ISO UTC string for strict sorting
}

/**
 * Metric object adhering to assessment specification
 */
export interface TelemetryMetric<TUnit extends string = string> {
  readonly value: number;
  readonly unit: TUnit;
  readonly history: readonly TelemetryHistoryPoint[];
}

/**
 * Root contract for GET /api/dashboard response
 */
export interface DashboardResponse {
  readonly timestamp: string; // ISO 8601 UTC string
  readonly velocity: TelemetryMetric<VelocityUnit>;
  readonly pressure: TelemetryMetric<PressureUnit>;
  readonly temperature: TelemetryMetric<TemperatureUnit>;
}

/**
 * Canonical initial baseline constants defined in specification
 */
export const CANONICAL_BASELINES = {
  velocity: {
    value: 185.4,
    unit: "cm/s" as VelocityUnit,
  },
  pressure: {
    value: 1012.0,
    unit: "mbar" as PressureUnit,
  },
  temperature: {
    value: 36.8,
    unit: "°C" as TemperatureUnit,
  },
} as const;

/**
 * Standard Status Deviation Thresholds
 */
export const STATUS_THRESHOLDS = {
  NORMAL_MAX_PERCENT: 10.0,
  WARNING_MAX_PERCENT: 20.0,
} as const;

/**
 * Normalized row representation for CSV / Excel exports
 */
export interface ExportRow {
  readonly timestamp: string;
  readonly velocity: number;
  readonly velocityUnit: VelocityUnit;
  readonly pressure: number;
  readonly pressureUnit: PressureUnit;
  readonly temperature: number;
  readonly temperatureUnit: TemperatureUnit;
}

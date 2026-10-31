import {
  MetricKey,
  MeasurementUnit,
  VelocityUnit,
  PressureUnit,
  TemperatureUnit,
  MetricStatus,
  DashboardResponse,
  TelemetryHistoryPoint,
  CANONICAL_BASELINES,
} from "telemetry-contracts";

export type {
  MetricKey,
  MeasurementUnit,
  VelocityUnit,
  PressureUnit,
  TemperatureUnit,
  MetricStatus,
  DashboardResponse,
  TelemetryHistoryPoint,
};

export type ConnectionState = "connecting" | "connected" | "reconnecting" | "offline" | "error";

export type AppTheme = "dark" | "light";

export type ExportStatus = "idle" | "exporting" | "success" | "cancelled" | "error" | "empty";

export interface TelemetryDesktopBridge {
  getApiEndpoint: () => Promise<string>;
  showSaveDialog: (options: {
    defaultPath?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }) => Promise<string | null>;
  saveFile: (filePath: string, content: string | Uint8Array) => Promise<boolean>;
  getAppVersion: () => Promise<string>;
}

declare global {
  interface Window {
    telemetryDesktop?: TelemetryDesktopBridge;
  }
}

export interface ConvertedHistoryPoint {
  readonly time: string;
  readonly value: number;
  readonly timestamp?: string;
}

export interface TelemetryPanelViewModel {
  readonly key: MetricKey;
  readonly label: string;
  readonly canonicalValue: number;
  readonly canonicalUnit: MeasurementUnit;
  readonly displayValue: number;
  readonly displayUnit: MeasurementUnit;
  readonly supportedUnits: readonly MeasurementUnit[];
  readonly baseline: number;
  readonly gaugeMin: number;
  readonly gaugeMax: number;
  readonly status: MetricStatus;
  readonly lastUpdated: string;
  readonly history: readonly ConvertedHistoryPoint[];
  readonly description: string;
}

export interface AlignedTelemetryRecord {
  readonly timestamp: string;
  readonly time: string;
  readonly velocity: number;
  readonly pressure: number;
  readonly temperature: number;
}

export interface MetricDisplayConfig {
  readonly key: MetricKey;
  readonly label: string;
  readonly defaultUnit: MeasurementUnit;
  readonly baseline: number;
  readonly gaugeMin: number;
  readonly gaugeMax: number;
  readonly icon: string;
  readonly description: string;
}

export const METRIC_DISPLAY_CONFIGS: Record<MetricKey, MetricDisplayConfig> = {
  velocity: {
    key: "velocity",
    label: "Velocity",
    defaultUnit: CANONICAL_BASELINES.velocity.unit,
    baseline: CANONICAL_BASELINES.velocity.value,
    gaugeMin: 0,
    gaugeMax: 300,
    icon: "/assets/icons/velocity.png",
    description: "Controller linear motion rate",
  },
  pressure: {
    key: "pressure",
    label: "Pressure",
    defaultUnit: CANONICAL_BASELINES.pressure.unit,
    baseline: CANONICAL_BASELINES.pressure.value,
    gaugeMin: 600,
    gaugeMax: 1400,
    icon: "/assets/icons/pressure.png",
    description: "Chamber atmospheric pressure",
  },
  temperature: {
    key: "temperature",
    label: "Temperature",
    defaultUnit: CANONICAL_BASELINES.temperature.unit,
    baseline: CANONICAL_BASELINES.temperature.value,
    gaugeMin: 0,
    gaugeMax: 70,
    icon: "/assets/icons/temperature.png",
    description: "Core controller temperature",
  },
};

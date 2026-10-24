import type {
  MetricKey,
  VelocityUnit,
  PressureUnit,
  TemperatureUnit,
  MeasurementUnit,
  MetricStatus,
  ConnectionStatus,
  TelemetryHistoryPoint,
  TelemetryMetric,
  DashboardResponse,
  ExportRow as ContractExportRow,
} from 'telemetry-contracts';

export type {
  MetricKey,
  VelocityUnit,
  PressureUnit,
  TemperatureUnit,
  MeasurementUnit,
  MetricStatus,
  ConnectionStatus,
  TelemetryHistoryPoint,
  TelemetryMetric,
  DashboardResponse,
};

/**
 * Application connection states
 */
export type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'offline' | 'error';

/**
 * Theme states
 */
export type AppTheme = 'dark' | 'light';

/**
 * Export states
 */
export type ExportStatus = 'idle' | 'exporting' | 'success' | 'cancelled' | 'error' | 'empty';

/**
 * Native Electron desktop bridge interface exposed via preload script
 */
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

/**
 * Historical telemetry sample point
 */
export interface ConvertedHistoryPoint {
  readonly time: string;
  readonly value: number;
  readonly timestamp?: string;
}


/**
 * View model representing a complete telemetry panel card
 */
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

/**
 * Synchronized telemetry sample record across all 3 parameters
 */
export interface AlignedTelemetryRecord {
  readonly timestamp: string; // ISO 8601 UTC
  readonly time: string; // HH:mm:ss display time
  readonly velocity: number; // canonical cm/s
  readonly pressure: number; // canonical mbar
  readonly temperature: number; // canonical °C
}

/**
 * Row representation for CSV / Excel exports
 */
export interface ExportRow {
  timestamp: string;
  velocity: number;
  pressure: number;
  temperature: number;
}

/**
 * Metric UI display configuration
 */
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


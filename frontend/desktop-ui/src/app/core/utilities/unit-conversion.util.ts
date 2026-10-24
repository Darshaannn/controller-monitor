import {
  MetricKey,
  MeasurementUnit,
  VelocityUnit,
  PressureUnit,
  TemperatureUnit,
} from 'telemetry-contracts';

export const SUPPORTED_UNITS = {
  velocity: ['mm/s', 'cm/s', 'm/s', 'km/h', 'ft/s'] as const satisfies readonly VelocityUnit[],
  pressure: ['Pa', 'kPa', 'mbar', 'bar', 'psi', 'atm'] as const satisfies readonly PressureUnit[],
  temperature: ['°C', '°F', 'K'] as const satisfies readonly TemperatureUnit[],
} as const;

/**
 * Velocity Conversion
 * Canonical unit: cm/s
 * mm/s = cm/s * 10
 * cm/s = cm/s
 * m/s = cm/s / 100
 * km/h = cm/s * 0.036
 * ft/s = cm/s * 0.03280839895
 */
export function convertVelocity(canonicalCmPerSec: number, targetUnit: VelocityUnit): number {
  if (!Number.isFinite(canonicalCmPerSec)) return 0;
  switch (targetUnit) {
    case 'mm/s':
      return canonicalCmPerSec * 10;
    case 'cm/s':
      return canonicalCmPerSec;
    case 'm/s':
      return canonicalCmPerSec / 100;
    case 'km/h':
      return canonicalCmPerSec * 0.036;
    case 'ft/s':
      return canonicalCmPerSec * 0.03280839895;
    default:
      return canonicalCmPerSec;
  }
}

/**
 * Pressure Conversion
 * Canonical unit: mbar
 * Pa = mbar * 100
 * kPa = mbar * 0.1
 * mbar = mbar
 * bar = mbar / 1000
 * psi = mbar * 0.0145037738
 * atm = mbar * 0.0009869233
 */
export function convertPressure(canonicalMbar: number, targetUnit: PressureUnit): number {
  if (!Number.isFinite(canonicalMbar)) return 0;
  switch (targetUnit) {
    case 'Pa':
      return canonicalMbar * 100;
    case 'kPa':
      return canonicalMbar * 0.1;
    case 'mbar':
      return canonicalMbar;
    case 'bar':
      return canonicalMbar / 1000;
    case 'psi':
      return canonicalMbar * 0.0145037738;
    case 'atm':
      return canonicalMbar * 0.0009869233;
    default:
      return canonicalMbar;
  }
}

/**
 * Temperature Conversion
 * Canonical unit: °C (Affine conversion)
 * °C = °C
 * °F = (°C * 9/5) + 32
 * K = °C + 273.15
 */
export function convertTemperature(canonicalCelsius: number, targetUnit: TemperatureUnit): number {
  if (!Number.isFinite(canonicalCelsius)) return 0;
  switch (targetUnit) {
    case '°C':
      return canonicalCelsius;
    case '°F':
      return (canonicalCelsius * 9) / 5 + 32;
    case 'K':
      return canonicalCelsius + 273.15;
    default:
      return canonicalCelsius;
  }
}

/**
 * Inverse Velocity Conversion: Converts any supported velocity unit back to canonical cm/s
 */
export function toCanonicalVelocity(value: number, fromUnit: VelocityUnit): number {
  if (!Number.isFinite(value)) return 0;
  switch (fromUnit) {
    case 'mm/s':
      return value / 10;
    case 'cm/s':
      return value;
    case 'm/s':
      return value * 100;
    case 'km/h':
      return value / 0.036;
    case 'ft/s':
      return value / 0.03280839895;
    default:
      return value;
  }
}

/**
 * Inverse Pressure Conversion: Converts any supported pressure unit back to canonical mbar
 */
export function toCanonicalPressure(value: number, fromUnit: PressureUnit): number {
  if (!Number.isFinite(value)) return 0;
  switch (fromUnit) {
    case 'Pa':
      return value / 100;
    case 'kPa':
      return value / 0.1;
    case 'mbar':
      return value;
    case 'bar':
      return value * 1000;
    case 'psi':
      return value / 0.0145037738;
    case 'atm':
      return value / 0.0009869233;
    default:
      return value;
  }
}

/**
 * Inverse Temperature Conversion: Converts any supported temperature unit back to canonical °C
 */
export function toCanonicalTemperature(value: number, fromUnit: TemperatureUnit): number {
  if (!Number.isFinite(value)) return 0;
  switch (fromUnit) {
    case '°C':
      return value;
    case '°F':
      return ((value - 32) * 5) / 9;
    case 'K':
      return value - 273.15;
    default:
      return value;
  }
}

/**
 * Generic metric converter taking metric key, canonical value, and target unit.
 */
export function convertMetricValue(
  metricKey: MetricKey,
  canonicalValue: number,
  targetUnit: MeasurementUnit,
): number {
  switch (metricKey) {
    case 'velocity':
      return convertVelocity(canonicalValue, targetUnit as VelocityUnit);
    case 'pressure':
      return convertPressure(canonicalValue, targetUnit as PressureUnit);
    case 'temperature':
      return convertTemperature(canonicalValue, targetUnit as TemperatureUnit);
    default:
      return canonicalValue;
  }
}

/**
 * Unit-aware decimal formatting to prevent floating-point artifacts.
 */
export function formatMeasurement(value: number, unit: MeasurementUnit): string {
  if (!Number.isFinite(value)) return '--';
  // Adjust decimal precision based on unit scale
  switch (unit) {
    case 'm/s':
    case 'bar':
    case 'atm':
      return value.toFixed(3);
    case 'kPa':
    case 'psi':
    case 'km/h':
    case 'ft/s':
      return value.toFixed(2);
    case 'mm/s':
    case 'Pa':
      return value.toFixed(0);
    case 'cm/s':
    case 'mbar':
    case '°C':
    case '°F':
    case 'K':
    default:
      return value.toFixed(1);
  }
}

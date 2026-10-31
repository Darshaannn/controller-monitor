import { MetricStatus, STATUS_THRESHOLDS } from "telemetry-contracts";

/**
 * Calculates measurement status based on relative percentage deviation from canonical baseline.
 * Status formula: deviation = (|currentValue - baselineValue| / |baselineValue|) * 100%
 * - Normal: deviation <= 10%
 * - Warning: 10% < deviation <= 20%
 * - Critical: deviation > 20%
 */
export function calculateMetricStatus(currentValue: number, baselineValue: number): MetricStatus {
  if (!Number.isFinite(currentValue) || !Number.isFinite(baselineValue)) {
    return "critical";
  }

  if (baselineValue === 0) {
    const diff = Math.abs(currentValue);
    if (diff === 0) return "normal";
    if (diff <= 1) return "warning";
    return "critical";
  }

  const deviationPercent = (Math.abs(currentValue - baselineValue) / Math.abs(baselineValue)) * 100;

  if (deviationPercent <= STATUS_THRESHOLDS.NORMAL_MAX_PERCENT) {
    return "normal";
  }
  if (deviationPercent <= STATUS_THRESHOLDS.WARNING_MAX_PERCENT) {
    return "warning";
  }
  return "critical";
}

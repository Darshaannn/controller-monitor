"use client";

import React, { useMemo } from "react";
import { MetricStatus, MeasurementUnit } from "@/types/telemetry";
import { formatMeasurement } from "@/lib/unit-conversion";

interface CircularGaugeProps {
  value: number;
  min?: number;
  max?: number;
  unit?: MeasurementUnit;
  label?: string;
  status?: MetricStatus;
}

export const CircularGauge: React.FC<CircularGaugeProps> = ({
  value,
  min = 0,
  max = 100,
  unit = "cm/s",
  label = "Metric",
  status = "normal",
}) => {
  // Proportions: Clean 128px diameter with 9px refined stroke
  const size = 128;
  const strokeWidth = 9;
  const center = 64;
  const radius = 51;
  const circumference = 2 * Math.PI * radius; // ~320.44
  const arcLength = circumference * 0.75; // 270 degree arc

  const normalizedProgress = useMemo(() => {
    if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max)) {
      return 0;
    }
    if (max <= min) return 0;
    const clamped = Math.max(min, Math.min(max, value));
    return (clamped - min) / (max - min);
  }, [value, min, max]);

  const arcOffset = arcLength * (1 - normalizedProgress);

  const strokeColor =
    status === "normal"
      ? "var(--status-normal)"
      : status === "warning"
      ? "var(--status-warning)"
      : "var(--status-critical)";

  const formattedValue = useMemo(() => {
    if (!Number.isFinite(value)) return "--";
    return formatMeasurement(value, unit);
  }, [value, unit]);

  return (
    <div
      className="position-relative d-flex justify-content-center align-items-center"
      role="meter"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuetext={`${formattedValue} ${unit} (${status})`}
      style={{ width: size, height: size, margin: "0.25rem auto 0.75rem auto" }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background Track (270 deg arc) */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--gauge-track)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(135 ${center} ${center})`}
        />

        {/* Foreground Progress Arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={arcOffset}
          strokeLinecap="round"
          transform={`rotate(135 ${center} ${center})`}
          style={{ transition: "stroke-dashoffset 0.4s ease, stroke 0.3s ease" }}
        />
      </svg>

      {/* Gauge Center Reading */}
      <div
        className="position-absolute text-center d-flex flex-column justify-content-center align-items-center"
        style={{ pointerEvents: "none", width: "100%", height: "100%", padding: "0 10px" }}
      >
        <div
          className="gauge-value fw-bold text-truncate"
          style={{
            fontSize: "1.65rem",
            lineHeight: 1.1,
            letterSpacing: "-0.01em",
            maxWidth: "100%",
            color: "var(--text-main)",
          }}
        >
          {formattedValue}
        </div>
        <div
          className="text-muted small fw-semibold"
          style={{ fontSize: "0.75rem", marginTop: 2, letterSpacing: "0.02em" }}
        >
          {unit}
        </div>
        <div
          className="text-muted-subtle x-small"
          style={{ fontSize: "0.6875rem", marginTop: 4, opacity: 0.8 }}
        >
          {min} – {max}
        </div>
      </div>
    </div>
  );
};

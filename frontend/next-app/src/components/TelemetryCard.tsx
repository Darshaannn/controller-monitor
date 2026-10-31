"use client";

import React, { useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { TelemetryPanelViewModel, MeasurementUnit } from "@/types/telemetry";
import { CircularGauge } from "./CircularGauge";
import { StatusBadge } from "./StatusBadge";

const TelemetryChart = dynamic(
  () => import("./TelemetryChart").then((mod) => mod.TelemetryChart),
  { ssr: false },
);

interface TelemetryCardProps {
  model: TelemetryPanelViewModel;
  theme: "light" | "dark";
  onUnitChange: (unit: MeasurementUnit) => void;
}

export const TelemetryCard: React.FC<TelemetryCardProps> = ({
  model,
  theme,
  onUnitChange,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const formattedDeviation = () => {
    if (!Number.isFinite(model.displayValue) || !Number.isFinite(model.baseline)) {
      return "--";
    }
    const diff = model.displayValue - model.baseline;
    const sign = diff > 0 ? "+" : "";
    const pct = model.baseline !== 0 ? ((diff / Math.abs(model.baseline)) * 100).toFixed(1) : "0.0";
    return `${sign}${diff.toFixed(1)} ${model.displayUnit} (${sign}${pct}%)`;
  };

  return (
    <div className="telemetry-card h-100" data-metric={model.key}>
      {/* Card Header: Cleanly spaced identity and action controls */}
      <div className="card-header-styled d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <div
            className="d-flex align-items-center justify-content-center"
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              backgroundColor:
                model.key === "velocity"
                  ? "var(--status-normal-subtle)"
                  : model.key === "pressure"
                  ? "var(--status-warning-subtle)"
                  : "var(--status-critical-subtle)",
              marginRight: 12,
              padding: 6,
              flexShrink: 0,
            }}
          >
            <Image
              src={
                model.key === "velocity"
                  ? "/assets/icons/velocity.png"
                  : model.key === "pressure"
                  ? "/assets/icons/pressure.png"
                  : "/assets/icons/temperature.png"
              }
              alt={`${model.label} icon`}
              width={22}
              height={22}
              style={{ objectFit: "contain" }}
            />
          </div>
          <div>
            <h2
              className="card-title h6 mb-0"
              style={{
                fontSize: "1.05rem",
                letterSpacing: "0.01em",
                color: "var(--text-main)",
              }}
            >
              {model.label}
            </h2>
            <span
              className="text-muted small"
              style={{ fontSize: "0.75rem", display: "block", marginTop: 1 }}
            >
              {model.description}
            </span>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* Polished Unit Selector Pill */}
          <div className="position-relative">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-expanded={isDropdownOpen}
              aria-label={`${model.label} Unit Selector`}
              style={{
                padding: "3px 8px",
                fontSize: "0.75rem",
                borderRadius: "0.375rem",
                fontWeight: 600,
              }}
            >
              <span>{model.displayUnit}</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transition: "transform 0.15s ease",
                  transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {isDropdownOpen && (
              <>
                <div
                  className="position-fixed"
                  style={{ top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 50 }}
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div
                  className="position-absolute shadow-lg"
                  style={{
                    top: "100%",
                    right: 0,
                    marginTop: 6,
                    zIndex: 60,
                    minWidth: 110,
                    backgroundColor: "var(--dropdown-bg)",
                    border: "1px solid var(--panel-border)",
                    borderRadius: "0.5rem",
                    padding: "4px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.25)",
                  }}
                >
                  {model.supportedUnits.map((u) => (
                    <button
                      key={u}
                      type="button"
                      className="d-flex align-items-center justify-content-between w-100"
                      style={{
                        padding: "6px 10px",
                        fontSize: "0.75rem",
                        borderRadius: "0.25rem",
                        background: u === model.displayUnit ? "var(--dropdown-hover)" : "transparent",
                        border: "none",
                        color: "var(--text-main)",
                        cursor: "pointer",
                        fontWeight: u === model.displayUnit ? 600 : 400,
                        textAlign: "left",
                      }}
                      onClick={() => {
                        onUnitChange(u);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <span>{u}</span>
                      {u === model.displayUnit && (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--accent-cyan)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <StatusBadge status={model.status} />
        </div>
      </div>

      {/* Primary Reading / Gauge Section */}
      <div className="card-body-styled d-flex flex-column align-items-center justify-content-center">
        <CircularGauge
          value={model.displayValue}
          min={model.gaugeMin}
          max={model.gaugeMax}
          unit={model.displayUnit}
          label={model.label}
          status={model.status}
        />

        {/* Baseline Comparison & Deviation: Distinct clean container with ample padding */}
        <div
          className="d-flex justify-content-between align-items-center w-100"
          style={{
            backgroundColor: "var(--meta-box-bg)",
            border: "1px solid var(--panel-border)",
            borderRadius: "0.5rem",
            padding: "0.625rem 0.875rem",
            marginTop: "0.25rem",
          }}
        >
          <div>
            <span
              className="text-muted-subtle d-block x-small text-uppercase fw-semibold"
              style={{ letterSpacing: "0.04em", fontSize: "0.65rem" }}
            >
              Baseline
            </span>
            <span className="fw-semibold small" style={{ color: "var(--text-main)" }}>
              {model.baseline} {model.displayUnit}
            </span>
          </div>

          <div className="text-end">
            <span
              className="text-muted-subtle d-block x-small text-uppercase fw-semibold"
              style={{ letterSpacing: "0.04em", fontSize: "0.65rem" }}
            >
              Deviation
            </span>
            <span
              className={`fw-bold small ${
                model.status === "normal"
                  ? "text-success"
                  : model.status === "warning"
                  ? "text-warning"
                  : "text-danger"
              }`}
            >
              {formattedDeviation()}
            </span>
          </div>
        </div>

        {/* Live Interactive Chart.js Graph Component */}
        <TelemetryChart
          metricKey={model.key}
          history={model.history}
          unit={model.displayUnit}
          label={model.label}
          theme={theme}
        />
      </div>

      {/* Card Footer: Clear, balanced sample counters and timestamp */}
      <div className="card-footer-styled d-flex justify-content-between align-items-center">
        <span className="text-muted x-small">
          Samples: <strong style={{ color: "var(--text-main)" }}>{model.history.length}</strong> / 100
        </span>
        <span className="text-muted x-small">
          Updated: <span style={{ color: "var(--text-main)" }}>{model.lastUpdated || "--:--:--"}</span>
        </span>
      </div>
    </div>
  );
};

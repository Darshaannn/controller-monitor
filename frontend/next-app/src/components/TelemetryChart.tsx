"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import { MetricKey, MeasurementUnit, ConvertedHistoryPoint } from "@/types/telemetry";

if (typeof window !== "undefined") {
  Chart.register(
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Title,
    Tooltip,
    Legend,
    zoomPlugin,
  );
}

interface TelemetryChartProps {
  metricKey: MetricKey;
  history: readonly ConvertedHistoryPoint[];
  unit: MeasurementUnit;
  label?: string;
  theme: "light" | "dark";
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({
  metricKey,
  history,
  unit,
  label = "Trend",
  theme,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart<"line"> | null>(null);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

  const getMetricColors = (key: MetricKey) => {
    switch (key) {
      case "velocity":
        return {
          border: "#10b981",
          background: "rgba(16, 185, 129, 0.08)",
          point: "#10b981",
        };
      case "pressure":
        return {
          border: "#f59e0b",
          background: "rgba(245, 158, 11, 0.08)",
          point: "#f59e0b",
        };
      case "temperature":
        return {
          border: "#ef4444",
          background: "rgba(239, 68, 68, 0.08)",
          point: "#ef4444",
        };
      default:
        return {
          border: "#0284c7",
          background: "rgba(2, 132, 199, 0.08)",
          point: "#0284c7",
        };
    }
  };

  // Initialize Chart.js instance once
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const colors = getMetricColors(metricKey);
    const isDark = theme === "dark";

    const chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: history.map((h) => h.time),
        datasets: [
          {
            label: `${label} (${unit})`,
            data: history.map((h) => h.value),
            borderColor: colors.border,
            backgroundColor: colors.background,
            borderWidth: 2,
            tension: 0.35,
            fill: true,
            pointRadius: 2,
            pointBackgroundColor: colors.point,
            pointHoverRadius: 5,
            pointHitRadius: 10,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: true,
            backgroundColor: isDark ? "#0f172a" : "#ffffff",
            titleColor: isDark ? "#94a3b8" : "#475569",
            bodyColor: isDark ? "#f8fafc" : "#0f172a",
            borderColor: isDark ? "#1e293b" : "#e2e8f0",
            borderWidth: 1,
            padding: 10,
            boxPadding: 4,
            usePointStyle: true,
          },
          zoom: {
            pan: {
              enabled: true,
              mode: "x",
              onPan: () => setIsZoomed(true),
            },
            zoom: {
              wheel: { enabled: true },
              pinch: { enabled: true },
              mode: "x",
              onZoom: () => setIsZoomed(true),
            },
          },
        },
        scales: {
          x: {
            grid: {
              color: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(15, 23, 42, 0.04)",
            },
            ticks: {
              color: isDark ? "#64748b" : "#94a3b8",
              maxRotation: 0,
              maxTicksLimit: 5,
              font: { size: 10, family: "'Inter', sans-serif" },
            },
          },
          y: {
            grid: {
              color: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(15, 23, 42, 0.04)",
            },
            ticks: {
              color: isDark ? "#64748b" : "#94a3b8",
              font: { size: 10, family: "'Inter', sans-serif" },
              padding: 6,
            },
            title: {
              display: true,
              text: unit,
              color: isDark ? "#64748b" : "#94a3b8",
              font: { size: 10, weight: "bold", family: "'Inter', sans-serif" },
            },
          },
        },
      },
    });

    chartInstanceRef.current = chart;

    return () => {
      chart.destroy();
      chartInstanceRef.current = null;
    };
  }, [metricKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update dynamic data points
  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart) return;

    chart.data.labels = history.map((h) => h.time);
    if (chart.data.datasets[0]) {
      chart.data.datasets[0].data = history.map((h) => h.value);
      chart.data.datasets[0].label = `${label} (${unit})`;
    }

    if (chart.options.scales?.y?.title) {
      chart.options.scales.y.title.text = unit;
    }

    chart.update("none");
  }, [history, unit, label]);

  // Update theme colors
  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart) return;

    const isDark = theme === "dark";
    const gridColor = isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(15, 23, 42, 0.04)";
    const textColor = isDark ? "#64748b" : "#94a3b8";
    const tooltipBg = isDark ? "#0f172a" : "#ffffff";
    const tooltipTitle = isDark ? "#94a3b8" : "#475569";
    const tooltipBody = isDark ? "#f8fafc" : "#0f172a";
    const tooltipBorder = isDark ? "#1e293b" : "#e2e8f0";

    if (chart.options.scales?.x) {
      if (chart.options.scales.x.grid) chart.options.scales.x.grid.color = gridColor;
      if (chart.options.scales.x.ticks) chart.options.scales.x.ticks.color = textColor;
    }

    if (chart.options.scales?.y) {
      if (chart.options.scales.y.grid) chart.options.scales.y.grid.color = gridColor;
      if (chart.options.scales.y.ticks) chart.options.scales.y.ticks.color = textColor;
      if (chart.options.scales.y.title) chart.options.scales.y.title.color = textColor;
    }

    if (chart.options.plugins?.tooltip) {
      chart.options.plugins.tooltip.backgroundColor = tooltipBg;
      chart.options.plugins.tooltip.titleColor = tooltipTitle;
      chart.options.plugins.tooltip.bodyColor = tooltipBody;
      chart.options.plugins.tooltip.borderColor = tooltipBorder;
    }

    chart.update("none");
  }, [theme]);

  const handleZoomIn = () => {
    const chart = chartInstanceRef.current;
    if (chart) {
      chart.zoom(1.2);
      setIsZoomed(true);
    }
  };

  const handleZoomOut = () => {
    const chart = chartInstanceRef.current;
    if (chart) {
      chart.zoom(0.8);
      setIsZoomed(true);
    }
  };

  const handleResetZoom = () => {
    const chart = chartInstanceRef.current;
    if (chart) {
      chart.resetZoom();
      setIsZoomed(false);
    }
  };

  return (
    <div className="w-100 position-relative" style={{ marginTop: "1rem" }}>
      {/* Header bar for chart title & zoom controls cleanly separated */}
      <div className="d-flex justify-content-between align-items-center mb-2 px-1">
        <span
          className="text-muted-subtle text-uppercase fw-semibold"
          style={{ fontSize: "0.6875rem", letterSpacing: "0.05em" }}
        >
          History Trend (Rolling 100)
        </span>
        <div className="d-flex align-items-center gap-1">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            style={{ width: 22, height: 22, padding: 0, fontSize: "0.75rem", lineHeight: 1 }}
            onClick={handleZoomIn}
            title="Zoom In"
          >
            +
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            style={{ width: 22, height: 22, padding: 0, fontSize: "0.75rem", lineHeight: 1 }}
            onClick={handleZoomOut}
            title="Zoom Out"
          >
            −
          </button>
          {isZoomed && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              style={{ padding: "0 5px", height: 22, fontSize: "0.65rem", lineHeight: 1 }}
              onClick={handleResetZoom}
              title="Reset Zoom"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div style={{ width: "100%", height: 180 }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

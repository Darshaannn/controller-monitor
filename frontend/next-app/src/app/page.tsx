"use client";

import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  DashboardResponse,
  VelocityUnit,
  PressureUnit,
  TemperatureUnit,
  MeasurementUnit,
  ConnectionState,
  ExportStatus,
  AppTheme,
  AlignedTelemetryRecord,
  TelemetryPanelViewModel,
  ConvertedHistoryPoint,
  METRIC_DISPLAY_CONFIGS,
} from "@/types/telemetry";
import {
  convertVelocity,
  convertPressure,
  convertTemperature,
  SUPPORTED_UNITS,
} from "@/lib/unit-conversion";
import { calculateMetricStatus } from "@/lib/metric-status";
import {
  prepareExportData,
  generateCsvContent,
  generateExcelBuffer,
  triggerBrowserDownload,
} from "@/lib/telemetry-export";
import { AppHeader } from "@/components/AppHeader";
import { TelemetryCard } from "@/components/TelemetryCard";

export default function DashboardPage() {
  const [theme, setTheme] = useState<AppTheme>("light");
  const [snapshot, setSnapshot] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const [exportStatus, setExportStatus] = useState<ExportStatus>("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Selected display units
  const [selectedVelocityUnit, setSelectedVelocityUnit] = useState<VelocityUnit>("cm/s");
  const [selectedPressureUnit, setSelectedPressureUnit] = useState<PressureUnit>("mbar");
  const [selectedTemperatureUnit, setSelectedTemperatureUnit] = useState<TemperatureUnit>("°C");

  // In-memory chronological aligned records
  const sessionRecordsMap = useRef<Map<string, AlignedTelemetryRecord>>(new Map());
  const [sessionRecords, setSessionRecords] = useState<readonly AlignedTelemetryRecord[]>([]);

  // Base URL resolution (for Electron IPC or standard web)
  const [apiBaseUrl, setApiBaseUrl] = useState<string>("");

  useEffect(() => {
    // Check local storage for theme
    try {
      const savedTheme = localStorage.getItem("telemetry_monitor_theme") as AppTheme | null;
      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
        document.documentElement.setAttribute("data-theme", savedTheme);
      }
    } catch {
      // Ignore storage errors
    }

    // Resolve API endpoint if running inside Electron
    if (typeof window !== "undefined" && window.telemetryDesktop) {
      window.telemetryDesktop.getApiEndpoint().then((endpoint) => {
        setApiBaseUrl(endpoint.replace(/\/+$/, ""));
      }).catch(() => {
        setApiBaseUrl("");
      });
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme: AppTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    try {
      localStorage.setItem("telemetry_monitor_theme", nextTheme);
    } catch {
      // Ignore storage errors
    }
  };

  // Ingest snapshot into session accumulator
  const ingestSnapshot = useCallback((data: DashboardResponse) => {
    if (!data?.velocity || !data?.pressure || !data?.temperature) return;

    const map = sessionRecordsMap.current;
    let modified = false;

    // Backfill history points
    const vHist = data.velocity.history || [];
    const pHist = data.pressure.history || [];
    const tHist = data.temperature.history || [];
    const minLen = Math.min(vHist.length, pHist.length, tHist.length);

    for (let i = 0; i < minLen; i++) {
      const v = vHist[i];
      const p = pHist[i];
      const t = tHist[i];
      const key = v.timestamp || `${data.timestamp.split("T")[0]}T${v.time}Z`;

      if (!map.has(key)) {
        map.set(key, {
          timestamp: key,
          time: v.time,
          velocity: v.value,
          pressure: p.value,
          temperature: t.value,
        });
        modified = true;
      }
    }

    // Ingest latest authoritative snapshot
    const currentKey = data.timestamp;
    if (!map.has(currentKey)) {
      const timeStr = new Date(data.timestamp).toISOString().substring(11, 19);
      map.set(currentKey, {
        timestamp: currentKey,
        time: timeStr,
        velocity: data.velocity.value,
        pressure: data.pressure.value,
        temperature: data.temperature.value,
      });
      modified = true;
    }

    if (modified) {
      // Keep max 50,000 samples
      if (map.size > 50000) {
        const excess = map.size - 50000;
        const keys = map.keys();
        for (let i = 0; i < excess; i++) {
          const k = keys.next().value;
          if (k) map.delete(k);
        }
      }
      const sorted = Array.from(map.values()).sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
      setSessionRecords(sorted);
    }
  }, []);

  // Fetch single snapshot via REST fallback with resilient error suppression
  const fetchDashboardSnapshot = useCallback(async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/dashboard`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data: DashboardResponse = await res.json();
      setSnapshot(data);
      ingestSnapshot(data);
      setLoading(false);
      setErrorMessage(null);
    } catch {
      // Gracefully handle server offline or restarting without uncaught dev overlay error
      setConnectionState("offline");
    }
  }, [apiBaseUrl, ingestSnapshot]);

  // Handle SSE Real-time streaming with exponential backoff & graceful retry
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isUnmounted = false;
    let backoffMs = 2000;

    const connectSSE = () => {
      if (isUnmounted) return;
      setConnectionState("connecting");

      try {
        const streamUrl = `${apiBaseUrl}/api/telemetry/stream`;
        eventSource = new EventSource(streamUrl);

        eventSource.addEventListener("snapshot", (e) => {
          try {
            const data: DashboardResponse = JSON.parse(e.data);
            setSnapshot(data);
            ingestSnapshot(data);
            setLoading(false);
            setErrorMessage(null);
            setConnectionState("connected");
            backoffMs = 2000; // Reset backoff on success
          } catch {
            // Silently ignore corrupted frame
          }
        });

        eventSource.onopen = () => {
          setConnectionState("connected");
          backoffMs = 2000;
        };

        eventSource.onerror = () => {
          setConnectionState("reconnecting");
          if (eventSource) {
            try {
              eventSource.close();
            } catch {
              // Ignore close error
            }
            eventSource = null;
          }
          // Silent fallback polling
          fetchDashboardSnapshot().catch(() => {});
          
          if (!isUnmounted) {
            reconnectTimeout = setTimeout(connectSSE, backoffMs);
            backoffMs = Math.min(backoffMs * 1.5, 10000);
          }
        };
      } catch {
        setConnectionState("offline");
        if (!isUnmounted) {
          reconnectTimeout = setTimeout(connectSSE, 3000);
        }
      }
    };

    connectSSE();

    return () => {
      isUnmounted = true;
      if (eventSource) {
        try {
          eventSource.close();
        } catch {
          // Ignore close error
        }
      }
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [apiBaseUrl, fetchDashboardSnapshot, ingestSnapshot]);

  // On demand manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardSnapshot();
    setTimeout(() => setRefreshing(false), 500);
  };

  // Export handlers (CSV & Excel with Electron native dialog fallback)
  const handleExportCsv = async () => {
    if (sessionRecords.length === 0) {
      setExportStatus("empty");
      setStatusMessage("No telemetry session data to export");
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    setExportStatus("exporting");
    setStatusMessage("Generating CSV...");

    try {
      const { rows, units } = prepareExportData(
        sessionRecords,
        selectedVelocityUnit,
        selectedPressureUnit,
        selectedTemperatureUnit,
      );
      const csv = generateCsvContent(rows, units);
      const filename = `telemetry_export_${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;

      if (typeof window !== "undefined" && window.telemetryDesktop) {
        const destPath = await window.telemetryDesktop.showSaveDialog({
          defaultPath: filename,
          filters: [{ name: "CSV (Comma Delimited)", extensions: ["csv"] }],
        });
        if (destPath) {
          await window.telemetryDesktop.saveFile(destPath, csv);
          setExportStatus("success");
          setStatusMessage("CSV exported successfully");
        } else {
          setExportStatus("cancelled");
          setStatusMessage("Export cancelled");
        }
      } else {
        triggerBrowserDownload(csv, filename, "text/csv;charset=utf-8;");
        setExportStatus("success");
        setStatusMessage("CSV exported successfully");
      }
    } catch (err) {
      console.error("Export CSV error:", err);
      setExportStatus("error");
      setStatusMessage("Failed to export CSV");
    } finally {
      setTimeout(() => {
        setStatusMessage(null);
        setExportStatus("idle");
      }, 3000);
    }
  };

  const handleExportExcel = async () => {
    if (sessionRecords.length === 0) {
      setExportStatus("empty");
      setStatusMessage("No telemetry session data to export");
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    setExportStatus("exporting");
    setStatusMessage("Generating Excel (.xlsx)...");

    try {
      const { rows, units } = prepareExportData(
        sessionRecords,
        selectedVelocityUnit,
        selectedPressureUnit,
        selectedTemperatureUnit,
      );
      const buffer = await generateExcelBuffer(rows, units);
      const filename = `telemetry_export_${new Date().toISOString().replace(/[:.]/g, "-")}.xlsx`;

      if (typeof window !== "undefined" && window.telemetryDesktop) {
        const destPath = await window.telemetryDesktop.showSaveDialog({
          defaultPath: filename,
          filters: [{ name: "Excel Workbook", extensions: ["xlsx"] }],
        });
        if (destPath) {
          await window.telemetryDesktop.saveFile(destPath, buffer);
          setExportStatus("success");
          setStatusMessage("Excel exported successfully");
        } else {
          setExportStatus("cancelled");
          setStatusMessage("Export cancelled");
        }
      } else {
        triggerBrowserDownload(
          buffer,
          filename,
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );
        setExportStatus("success");
        setStatusMessage("Excel exported successfully");
      }
    } catch (err) {
      console.error("Export Excel error:", err);
      setExportStatus("error");
      setStatusMessage("Failed to export Excel");
    } finally {
      setTimeout(() => {
        setStatusMessage(null);
        setExportStatus("idle");
      }, 3000);
    }
  };

  // Format Last Updated header time
  const lastUpdated = useMemo(() => {
    if (!snapshot) return null;
    const date = new Date(snapshot.timestamp);
    if (isNaN(date.getTime())) return snapshot.timestamp;
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }, [snapshot]);

  // Derived panels
  const panels = useMemo((): TelemetryPanelViewModel[] => {
    if (!snapshot) return [];

    // Velocity panel
    const velCfg = METRIC_DISPLAY_CONFIGS.velocity;
    const velMetric = snapshot.velocity;
    const velDisplayVal = convertVelocity(velMetric.value, selectedVelocityUnit);
    const velHistory: ConvertedHistoryPoint[] = velMetric.history.map((pt) => ({
      time: pt.time,
      value: Math.round(convertVelocity(pt.value, selectedVelocityUnit) * 10) / 10,
      timestamp: pt.timestamp,
    }));
    const velocityPanel: TelemetryPanelViewModel = {
      key: "velocity",
      label: velCfg.label,
      canonicalValue: velMetric.value,
      canonicalUnit: velMetric.unit,
      displayValue: velDisplayVal,
      displayUnit: selectedVelocityUnit,
      supportedUnits: SUPPORTED_UNITS.velocity,
      baseline: Math.round(convertVelocity(velCfg.baseline, selectedVelocityUnit) * 10) / 10,
      gaugeMin: Math.round(convertVelocity(velCfg.gaugeMin, selectedVelocityUnit) * 10) / 10,
      gaugeMax: Math.round(convertVelocity(velCfg.gaugeMax, selectedVelocityUnit) * 10) / 10,
      status: calculateMetricStatus(velMetric.value, velCfg.baseline),
      lastUpdated: velHistory.length > 0 ? velHistory[velHistory.length - 1].time : "",
      history: velHistory,
      description: velCfg.description,
    };

    // Pressure panel
    const presCfg = METRIC_DISPLAY_CONFIGS.pressure;
    const presMetric = snapshot.pressure;
    const presDisplayVal = convertPressure(presMetric.value, selectedPressureUnit);
    const presHistory: ConvertedHistoryPoint[] = presMetric.history.map((pt) => ({
      time: pt.time,
      value: Math.round(convertPressure(pt.value, selectedPressureUnit) * 10) / 10,
      timestamp: pt.timestamp,
    }));
    const pressurePanel: TelemetryPanelViewModel = {
      key: "pressure",
      label: presCfg.label,
      canonicalValue: presMetric.value,
      canonicalUnit: presMetric.unit,
      displayValue: presDisplayVal,
      displayUnit: selectedPressureUnit,
      supportedUnits: SUPPORTED_UNITS.pressure,
      baseline: Math.round(convertPressure(presCfg.baseline, selectedPressureUnit) * 10) / 10,
      gaugeMin: Math.round(convertPressure(presCfg.gaugeMin, selectedPressureUnit) * 10) / 10,
      gaugeMax: Math.round(convertPressure(presCfg.gaugeMax, selectedPressureUnit) * 10) / 10,
      status: calculateMetricStatus(presMetric.value, presCfg.baseline),
      lastUpdated: presHistory.length > 0 ? presHistory[presHistory.length - 1].time : "",
      history: presHistory,
      description: presCfg.description,
    };

    // Temperature panel
    const tempCfg = METRIC_DISPLAY_CONFIGS.temperature;
    const tempMetric = snapshot.temperature;
    const tempDisplayVal = convertTemperature(tempMetric.value, selectedTemperatureUnit);
    const tempHistory: ConvertedHistoryPoint[] = tempMetric.history.map((pt) => ({
      time: pt.time,
      value: Math.round(convertTemperature(pt.value, selectedTemperatureUnit) * 10) / 10,
      timestamp: pt.timestamp,
    }));
    const temperaturePanel: TelemetryPanelViewModel = {
      key: "temperature",
      label: tempCfg.label,
      canonicalValue: tempMetric.value,
      canonicalUnit: tempMetric.unit,
      displayValue: tempDisplayVal,
      displayUnit: selectedTemperatureUnit,
      supportedUnits: SUPPORTED_UNITS.temperature,
      baseline: Math.round(convertTemperature(tempCfg.baseline, selectedTemperatureUnit) * 10) / 10,
      gaugeMin: Math.round(convertTemperature(tempCfg.gaugeMin, selectedTemperatureUnit) * 10) / 10,
      gaugeMax: Math.round(convertTemperature(tempCfg.gaugeMax, selectedTemperatureUnit) * 10) / 10,
      status: calculateMetricStatus(tempMetric.value, tempCfg.baseline),
      lastUpdated: tempHistory.length > 0 ? tempHistory[tempHistory.length - 1].time : "",
      history: tempHistory,
      description: tempCfg.description,
    };

    return [velocityPanel, pressurePanel, temperaturePanel];
  }, [snapshot, selectedVelocityUnit, selectedPressureUnit, selectedTemperatureUnit]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppHeader
        theme={theme}
        connectionState={connectionState}
        lastUpdated={lastUpdated}
        exportStatus={exportStatus}
        statusMessage={statusMessage}
        onToggleTheme={toggleTheme}
        onExportCsv={handleExportCsv}
        onExportExcel={handleExportExcel}
      />

      <main className="container-fluid" style={{ padding: "2rem", flex: 1 }}>
        {/* Page Header Title Section with relaxed spacing */}
        <div
          className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4 pb-3"
          style={{ borderBottom: "1px solid var(--panel-border)" }}
        >
          <div>
            <h2
              className="page-heading h4 fw-bold mb-1"
              style={{ fontSize: "1.45rem", letterSpacing: "0.01em", color: "var(--text-main)" }}
            >
              Real-Time Telemetry
            </h2>
            <p className="text-muted small mb-0" style={{ fontSize: "0.8125rem" }}>
              Embedded controller live state monitoring &amp; physical parameters
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-2"
              onClick={handleRefresh}
              disabled={loading || refreshing}
              aria-label="Refresh telemetry snapshot"
              id="refreshSnapshotBtn"
              style={{ padding: "0.4rem 0.85rem", fontWeight: 500 }}
            >
              <svg
                className={refreshing ? "spin-animation" : ""}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              <span>Refresh Snapshot</span>
            </button>
          </div>
        </div>

        {/* Content States */}
        {loading ? (
          <div className="row">
            {[1, 2, 3].map((i) => (
              <div key={i} className="col-12 col-md-6 col-xl-4">
                <div
                  className="telemetry-card p-4 text-center justify-content-center align-items-center"
                  style={{ minHeight: 460 }}
                >
                  <div
                    className="spin-animation mb-3"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      border: "3px solid var(--panel-border)",
                      borderTopColor: "var(--accent-cyan)",
                    }}
                  />
                  <div className="text-muted small fw-medium">Loading Telemetry Channel...</div>
                </div>
              </div>
            ))}
          </div>
        ) : errorMessage ? (
          <div
            className="telemetry-card p-4 text-center justify-content-center align-items-center"
            style={{ maxWidth: 540, margin: "3rem auto" }}
          >
            <div className="text-danger mb-3">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 className="h5 fw-bold mb-2">Connection Interrupted</h3>
            <p className="text-muted small mb-3">{errorMessage}</p>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={handleRefresh}
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <div className="row">
            {panels.map((panel) => (
              <div key={panel.key} className="col-12 col-md-6 col-xl-4">
                <TelemetryCard
                  model={panel}
                  theme={theme}
                  onUnitChange={(newUnit) => {
                    if (panel.key === "velocity") setSelectedVelocityUnit(newUnit as VelocityUnit);
                    else if (panel.key === "pressure") setSelectedPressureUnit(newUnit as PressureUnit);
                    else setSelectedTemperatureUnit(newUnit as TemperatureUnit);
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

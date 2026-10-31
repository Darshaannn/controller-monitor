"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ConnectionState, ExportStatus, AppTheme } from "@/types/telemetry";

interface AppHeaderProps {
  theme: AppTheme;
  connectionState: ConnectionState;
  lastUpdated: string | null;
  exportStatus: ExportStatus;
  statusMessage: string | null;
  onToggleTheme: () => void;
  onExportCsv: () => void;
  onExportExcel: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  theme,
  connectionState,
  lastUpdated,
  exportStatus,
  statusMessage,
  onToggleTheme,
  onExportCsv,
  onExportExcel,
}) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const connectionBadge = () => {
    switch (connectionState) {
      case "connected":
        return { text: "LIVE SSE", bg: "var(--status-normal-subtle)", color: "var(--status-normal)" };
      case "reconnecting":
        return { text: "RECONNECTING", bg: "var(--status-warning-subtle)", color: "var(--status-warning)" };
      case "connecting":
        return { text: "CONNECTING", bg: "var(--accent-cyan-subtle)", color: "var(--accent-cyan)" };
      default:
        return { text: "OFFLINE", bg: "var(--status-critical-subtle)", color: "var(--status-critical)" };
    }
  };

  const conn = connectionBadge();

  return (
    <header
      className="d-flex justify-content-between align-items-center"
      style={{
        borderBottom: "1px solid var(--panel-border)",
        backgroundColor: "var(--header-bg)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        padding: "0.875rem 2rem",
        position: "sticky",
        top: 0,
        zIndex: 100,
        transition: "background-color 0.2s ease, border-color 0.2s ease",
      }}
    >
      {/* Brand & Identity */}
      <div className="d-flex align-items-center">
        <div
          className="d-flex align-items-center justify-content-center"
          style={{
            marginRight: 14,
            width: 38,
            height: 38,
            borderRadius: 8,
            backgroundColor: "rgba(2, 132, 199, 0.08)",
            padding: 4,
          }}
        >
          <Image
            src="/assets/icons/app-logo.png"
            alt="Controller Monitor Logo"
            width={30}
            height={30}
            style={{ objectFit: "contain" }}
          />
        </div>
        <div>
          <h1
            className="brand-title mb-0"
            style={{
              fontSize: "1.2rem",
              lineHeight: 1.2,
              letterSpacing: "0.02em",
              color: "var(--text-main)",
            }}
          >
            Controller Monitor
          </h1>
          <span
            className="brand-subtitle text-muted small"
            style={{ fontSize: "0.75rem", display: "block" }}
          >
            Real-Time Telemetry Dashboard
          </span>
        </div>
      </div>

      {/* Actions, Status & Theme Area */}
      <div className="d-flex align-items-center gap-3">
        {/* Live Export Feedback Toast/Badge */}
        {statusMessage && (
          <div
            className="badge animate-fade-in text-truncate"
            style={{
              maxWidth: 180,
              padding: "5px 12px",
              fontSize: "0.75rem",
              backgroundColor:
                exportStatus === "success"
                  ? "var(--status-normal-subtle)"
                  : exportStatus === "error"
                  ? "var(--status-critical-subtle)"
                  : "var(--accent-cyan-subtle)",
              color:
                exportStatus === "success"
                  ? "var(--status-normal)"
                  : exportStatus === "error"
                  ? "var(--status-critical)"
                  : "var(--accent-cyan)",
              border: `1px solid currentColor`,
            }}
          >
            {statusMessage}
          </div>
        )}

        {/* Export Action Dropdown */}
        <div className="position-relative">
          <button
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2"
            type="button"
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            aria-expanded={isExportMenuOpen}
            aria-label="Export Telemetry Data"
            style={{ padding: "0.35rem 0.75rem", fontWeight: 500 }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export</span>
          </button>

          {isExportMenuOpen && (
            <>
              <div
                className="position-fixed"
                style={{ top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 50 }}
                onClick={() => setIsExportMenuOpen(false)}
              />
              <div
                className="position-absolute shadow-lg animate-fade-in"
                style={{
                  top: "100%",
                  right: 0,
                  marginTop: 6,
                  zIndex: 60,
                  minWidth: 190,
                  backgroundColor: "var(--dropdown-bg)",
                  border: "1px solid var(--panel-border)",
                  borderRadius: "0.5rem",
                  padding: "6px",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
                }}
              >
                <button
                  type="button"
                  className="d-flex align-items-center gap-2 w-100"
                  style={{
                    padding: "8px 12px",
                    fontSize: "0.8125rem",
                    borderRadius: "0.375rem",
                    border: "none",
                    background: "transparent",
                    color: "var(--text-main)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--dropdown-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  onClick={() => {
                    onExportCsv();
                    setIsExportMenuOpen(false);
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  <span>Export as CSV</span>
                </button>
                <button
                  type="button"
                  className="d-flex align-items-center gap-2 w-100"
                  style={{
                    padding: "8px 12px",
                    fontSize: "0.8125rem",
                    borderRadius: "0.375rem",
                    border: "none",
                    background: "transparent",
                    color: "var(--text-main)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--dropdown-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  onClick={() => {
                    onExportExcel();
                    setIsExportMenuOpen(false);
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                  <span>Export as Excel (.xlsx)</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center"
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
          style={{ width: 34, height: 34, padding: 0, borderRadius: "0.5rem" }}
        >
          {theme === "dark" ? (
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {lastUpdated && (
          <div className="text-end" style={{ minWidth: 75 }}>
            <div
              className="text-muted-subtle text-uppercase fw-semibold"
              style={{ fontSize: "0.625rem", letterSpacing: "0.04em", lineHeight: 1 }}
            >
              Last Tick
            </div>
            <div
              className="fw-semibold small"
              style={{ fontSize: "0.8125rem", marginTop: 3, color: "var(--text-main)" }}
            >
              {lastUpdated}
            </div>
          </div>
        )}

        {/* Connection status indicator */}
        <div
          className="badge d-flex align-items-center gap-2"
          style={{
            backgroundColor: conn.bg,
            color: conn.color,
            border: `1px solid ${conn.color}`,
            padding: "5px 10px",
            fontSize: "0.6875rem",
            fontWeight: 700,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: conn.color,
              display: "inline-block",
            }}
          />
          <span>{conn.text}</span>
        </div>
      </div>
    </header>
  );
};

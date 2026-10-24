# TELEMETRY MONITORING SYSTEM — REST API DOCUMENTATION

## 1. Overview
The telemetry backend simulation service exposes real-time embedded controller parameters over HTTP loopback.

- **Base URL:** `http://127.0.0.1:<dynamic_port>`
- **Content-Type:** `application/json`
- **Cache Policy:** `no-store, no-cache, must-revalidate, proxy-revalidate`
- **Update Cadence:** Exactly 1 tick per second (1,000ms scheduler)

---

## 2. Endpoints

### 2.1 GET `/api/dashboard`
Returns the current simulation snapshot and bounded historical data (up to 100 samples) for all three monitored parameters.

#### Response Headers:
- `Content-Type: application/json; charset=utf-8`
- `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate`

#### Response Body Schema (`DashboardResponse`):
```json
{
  "timestamp": "2026-10-16T15:14:49.344Z",
  "velocity": {
    "value": 197.1,
    "unit": "cm/s",
    "history": [
      {
        "time": "15:14:47",
        "value": 185.4,
        "timestamp": "2026-10-16T15:14:47.284Z"
      },
      {
        "time": "15:14:48",
        "value": 200.8,
        "timestamp": "2026-10-16T15:14:48.326Z"
      }
    ]
  },
  "pressure": {
    "value": 970.9,
    "unit": "mbar",
    "history": [ ... ]
  },
  "temperature": {
    "value": 32.9,
    "unit": "°C",
    "history": [ ... ]
  }
}
```

#### Fields Description:
- `timestamp` (string, ISO 8601 UTC): Generation timestamp of the snapshot.
- `velocity` (object): Velocity parameter in canonical unit `cm/s`.
- `pressure` (object): Pressure parameter in canonical unit `mbar`.
- `temperature` (object): Temperature parameter in canonical unit `°C`.
- `*.value` (number): Current numerical reading.
- `*.unit` (string): Canonical unit identifier.
- `*.history` (array): Chronologically ordered rolling samples (capped at maximum 100 entries).
  - `time` (string): `HH:mm:ss` timestamp format as specified in the assessment.
  - `value` (number): Metric value at the sample tick.
  - `timestamp` (string, optional ISO 8601 UTC): Extended full UTC ISO timestamp for sorting and export alignment.

---

### 2.2 GET `/api/health`
Returns the operational health and simulation engine status.

#### Response:
```json
{
  "status": "ok",
  "uptime": 12.34,
  "simulation": {
    "running": true,
    "phase": "VARIATION",
    "cycleCount": 3
  }
}
```

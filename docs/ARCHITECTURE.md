# ARCHITECTURE & SYSTEM DESIGN SPECIFICATION
**Project:** Embedded Controller — Real-Time Telemetry Monitoring Dashboard
**Target Runtime:** Windows Desktop (Electron + Angular 22 + Express)

---

## 1. System Overview & Component Topology

The system comprises three cleanly isolated architectural tiers running on the desktop workstation:

```
+---------------------------------------------------------------------------------+
|                               WINDOWS DESKTOP WORKSTATION                      |
|                                                                                 |
|  +---------------------------------------------------------------------------+  |
|  |                            ELECTRON HOST SHELL                            |  |
|  |                                                                           |  |
|  |  +---------------------------+             +---------------------------+  |  |
|  |  |   MAIN PROCESS (Node.js)  |             |  RENDERER PROCESS (Chromium)|  |
|  |  |   backend/electron        |             |   frontend/desktop-ui     |  |
|  |  |                           |             |                           |  |  |
|  |  |  * Window Lifecycle       |             |  * Angular 22 Standalone  |  |  |
|  |  |  * Dynamic Port Express   |             |  * SSE Real-Time Stream   |  |  |
|  |  |  * Strict CSP & Sandbox   |             |  * OnPush + Signals State |  |  |
|  |  |  * Native File Dialogs    |             |  * GlobalErrorHandler     |  |  |
|  |  |  * IPC Path Sanitization  |             |  * Formula-Safe CSV Export|  |  |
|  |  +-------------+-------------+             +-------------+-------------+  |  |
|  |                |                                         |                |  |
|  |                |       ContextBridge Preload Boundary    |                |  |
|  |                +=========================================+                |  |
|  |                      exposed: window.telemetryDesktop                     |  |
|  |                      - getApiEndpoint(): Promise<string>                  |  |
|  |                      - showSaveDialog(): Promise<string>                  |  |
|  |                      - saveFile(path, content): Promise<boolean>          |  |
|  +----------------+----------------------------------------------------------+  |
|                   |                                                             |
|                   v SSE & HTTP Loopback (127.0.0.1:<dynamic_port>)              |
|  +---------------------------------------------------------------------------+  |
|  |                   EXPRESS TELEMETRY SIMULATION SERVICE                    |  |
|  |                   backend/api                                             |  |
|  |                                                                           |  |
|  |  * GET /api/telemetry/stream (Server-Sent Events with keep-alive heartbeats)|
|  |  * GET /api/dashboard (bounded at 100 rolling samples)                    |  |
|  |  * 1-Second Independent Simulation Scheduler (EventEmitter stream)        |  |
|  |  * 5-Cycle Variation & Controlled Return-to-Baseline                      |  |
|  |  * Native .env loader & Centralized Error Handler Middleware               |  |
|  |  * Pure Canonical Data (Velocity: cm/s, Pressure: mbar, Temp: °C)         |  |
|  +---------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------+
```

---

## 2. Process Separation & Security Boundaries

1. **Renderer Isolation:**
   - `nodeIntegration: false`
   - `contextIsolation: true`
   - `sandbox: true`
   - Content Security Policy (CSP) strictly disallows inline script injection and restricts connect sources to `self` and loopback `127.0.0.1:*`.

2. **Backend Communication:**
   - Express runs strictly bound to `127.0.0.1` on a dynamically assigned OS port (port `0` or free port discovery), avoiding collisions with other local software.
   - The preload script exposes a secure read-only channel via `contextBridge` allowing Angular to retrieve the actual runtime base URL (`http://127.0.0.1:<port>`).
   - Angular connects via its native `HttpClient` using typed models from `@telemetry/contracts`.

---

## 3. Data Contracts & Precision Strategy

- **Canonical Units:** All internal data generation, rolling buffers, and HTTP responses strictly use canonical units:
  - Velocity: `cm/s`
  - Pressure: `mbar`
  - Temperature: `°C`
- **Frontend Conversions:** Any display unit conversion (e.g. `mbar` -> `psi`, `°C` -> `°F`) is computed purely in the Angular presentation layer and never triggers backend recalculations or network requests.
- **Rolling History Buffer:** The backend holds a ring buffer capped strictly at 100 samples per metric.

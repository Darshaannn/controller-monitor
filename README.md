# Controller Monitor — Real-Time Telemetry Dashboard

[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen)](<>)
[![Tests](https://img.shields.io/badge/Tests-89%2F89%20Passing-brightgreen)](<>)
[![Framework](https://img.shields.io/badge/Angular-19-red)](<>)
[![Desktop](https://img.shields.io/badge/Electron-35.7.5-blue)](<>)
[![Platform](https://img.shields.io/badge/Platform-Windows%20x64-blue)](<>)

A high-performance Windows Desktop Embedded Controller Monitoring Application built with **Angular 19**, **Electron**, **Node.js / Express**, **Chart.js**, and **Bootstrap 5**.

The application connects to an embedded controller simulation engine generating continuous telemetry samples (Velocity, Pressure, Temperature) every 1,000 milliseconds via **Server-Sent Events (SSE)**, featuring compact radial gauges, interactive trend charts, full 14-unit conversion, runtime light/dark themes, and native CSV/Excel session export.

---

## Key Features

1. **Continuous Real-Time Telemetry via Server-Sent Events (SSE)**:
   - Server-Sent Events stream (`/api/telemetry/stream`) powered by an `EventEmitter` architecture with 15-second keep-alive heartbeats.
   - Robust frontend reconnection state machine with clean fallback to REST polling (`getDashboard()`) if SSE is disrupted.
   - Zero memory leaks with automatic subscriber teardown upon navigation and connection termination.

2. **Compact SVG Circular Gauges & Health Badges**:
   - Compact 270° radial SVG progress gauge with status-based coloring.
   - Normal, Warning, and Critical semantic status badges computed against canonical baselines.

3. **Expanded Interactive Chart.js Trend Visualizations**:
   - Reusable telemetry chart component displaying rolling 100-sample history.
   - Generous 220px canvas viewport for clear trend analysis.
   - Real-time incremental dataset updates using `chart.update('none')` with zero canvas recreation or flickering.
   - Wheel zoom, drag pan, Zoom In/Out/Reset buttons, custom tooltips, and inspection tracking.

4. **Complete 14-Unit Conversion System**:
   - **Velocity (5 units)**: `cm/s` (canonical), `mm/s`, `m/s`, `km/h`, `ft/s`.
   - **Pressure (6 units)**: `mbar` (canonical), `Pa`, `kPa`, `bar`, `psi`, `atm`.
   - **Temperature (3 units)**: `°C` (canonical), `°F`, `K` (affine conversion).
   - Instant client-side conversions via pure TypeScript utility functions with **zero additional backend requests**.

5. **Runtime Light & Dark Theme Switching**:
   - Dark and Light modes toggled via navbar control button with Sun/Moon icons without page reload or chart data loss.
   - Design tokens synchronized across CSS variables, Bootstrap 5 `data-bs-theme`, and Chart.js scales/tooltips.
   - User preference persisted across sessions via `localStorage`.

6. **Comprehensive Telemetry Export**:
   - In-memory session accumulator capturing up to 50,000 aligned chronological samples.
   - RFC 4180 CSV generation with selected unit column headers and CSV formula injection neutralization (`=`, `+`, `-`, `@`, `\t`, `\r`).
   - Native Excel (.xlsx) workbook generation via `exceljs` with frozen headers and numeric cells.
   - Native Windows Save As dialog integration via secure Electron IPC with strict path and extension validation.

7. **Hardened Desktop Security**:
   - Chromium sandbox, `nodeIntegration: false`, `contextIsolation: true`, and `webSecurity: true`.
   - Strict Content Security Policy (CSP).
   - Navigation guards blocking external redirects and popup window creation.
   - Loopback-only dynamic Express port binding (`127.0.0.1:0`) with sanitized allowed origins.

8. **Clean, Modular Code Architecture**:
   - Dedicated `interfaces/` and `types/` directories in both frontend and backend for strict separation of typing contracts from implementation classes.
   - Angular Signals (`signal()`, `computed()`) for reactive, fine-grained UI updates with `OnPush` change detection.

---

## Technology Stack

| Layer                  | Technology             | Details                                                                  |
| ---------------------- | ---------------------- | ------------------------------------------------------------------------ |
| **Frontend Framework** | Angular 19             | Standalone Components, Signals, Computed, OnPush Change Detection        |
| **Styling & Design**   | Bootstrap 5.3.3 + SCSS | Custom theme tokens, dark/light modes, responsive layout                 |
| **Data Visualization** | Chart.js 4.4.8         | `chartjs-plugin-zoom 2.0.1`, Compact SVG Circular Gauges                 |
| **Desktop Shell**      | Electron 35.7.5        | ContextBridge, sandboxed preload, native file dialogs                    |
| **Simulation Backend** | Node.js + Express 4.21 | Independent 1-second ticks, 5-cycle variation/recovery, ring buffer, SSE |
| **Testing**            | Vitest (UI & API)      | 55 unit and integration tests (11 backend + 44 frontend)                 |
| **Packaging**          | Electron Builder 26.15 | Standalone Windows x64 executable and NSIS installer                     |

---

## Prerequisites

- **Node.js**: v20.x, v22.x, or v24.x
- **npm**: v10.x or v11.x
- **OS**: Windows 10 / 11 (64-bit)

---

## Installation & Setup

Clone the repository and install all workspace dependencies:

```powershell
git clone <repository-url>
cd "Sandip Assignmnet"
npm install
```

---

## Architecture & Separation of Concerns

```
Sandip Assignmnet/
├── backend/
│   ├── api/                    # Independent Express Backend (REST + SSE)
│   │   ├── src/models/         # Backend data types, interfaces & simulator contracts
│   │   ├── src/services/       # Pure simulation & ring buffer state (EventEmitter)
│   │   ├── src/controllers/    # HTTP & SSE stream controllers
│   │   ├── src/middleware/     # Global error handling & route fallbacks
│   │   ├── src/config/         # Native .env loader & simulation baselines
│   │   └── README.md
│   └── electron/               # Electron desktop shell & secure IPC bridge
├── frontend/
│   └── desktop-ui/             # Independent Angular 22 Dashboard Application
│       ├── src/app/core/models/# Centralized frontend models, interfaces & view models
│       ├── src/app/core/api/   # TelemetryApiService (SSE EventSource & dynamic port resolution)
│       ├── src/app/core/errors/# Global error handling service
│       ├── src/app/features/   # Dashboard feature facade & presentation cards
│       ├── src/app/shared/     # Reusable gauges, charts, badges & header
│       └── README.md
├── packages/
│   └── contracts/              # Shared canonical baseline constants & unit definitions
└── package.json                # Unified workspace scripts & security overrides
```

---

## Development Workflow

### Option 1: Run Full Desktop Environment (API + UI + Electron)

```powershell
npm run dev
```

### Option 2: Run Services Independently

Run backend and frontend in separate terminals:

```powershell
# In Terminal 1 (Backend REST & SSE API - http://127.0.0.1:3000)
npm run dev:backend

# In Terminal 2 (Angular Web Application - http://localhost:4200)
npm run dev:frontend
```

Alternatively, `cd` into either directory and run `npm run dev` (backend) or `npm start` (frontend).

### Option 3: Run Electron Shell with External Dev Server

```powershell
npm run dev:electron
```

### Option 4: Run on a Separate System (Cross-Machine / LAN Deployment)

You can host the Backend Telemetry Simulator on one system and access the Dashboard from another system across the network.

#### System A (Backend Server):

1. In `backend/api/.env`, configure the server to listen on all interfaces or your LAN IP:
   ```env
   HOST=0.0.0.0
   PORT=3000
   # Add System B's client origin (or * for development):
   CORS_ALLOWED_ORIGINS=http://localhost:4200,http://127.0.0.1:4200,http://<SYSTEM_B_IP>:4200
   ```
2. Start the backend:
   ```powershell
   npm run dev:backend
   ```
   _(Ensure Windows Firewall allows incoming connections on port 3000)._

#### System B (Frontend Client):

1. In `frontend/desktop-ui/src/environments/environment.ts` (or `environment.development.ts`), point the API base URL to System A's IP address:
   ```typescript
   export const environment = {
     production: false,
     apiBaseUrl: "http://<SYSTEM_A_IP>:3000",
     apiTimeoutMs: 5000,
     maxRetryAttempts: 2,
   };
   ```
2. Start the Angular UI:
   ```powershell
   npm run dev:frontend -- --host 0.0.0.0
   ```
3. Open a browser on System B at `http://localhost:4200` (or `http://<SYSTEM_B_IP>:4200`). The real-time SSE telemetry stream and gauges will connect directly to System A.

---

## Testing & Quality Assurance

The test suite is fully self-contained and executable on a clean clone without manual build prerequisites. Running `npm test` automatically prepares workspace dependencies via `pretest`:

```powershell
# Run the complete test suite across backend and frontend (89 total passing tests)
npm test

# Run frontend test suite directly (76 tests including round-trip conversions, fallbacks & export failures)
npm run test:frontend

# Run backend simulation and API test suite directly (13 tests including SSE stream lifecycle & cleanup)
npm run test:backend

# Run TypeScript strict typecheck across all workspaces
npm run typecheck
```

---

## Production Build & Packaging

Build all production artifacts (Contracts, Backend, Angular UI, Electron Main):

```powershell
npm run build
```

Package the standalone Windows x64 desktop application:

```powershell
npm run package:win
```

The resulting standalone executable will be located in:

```
release/win-unpacked/Controller Monitor.exe
```

---

## Project Structure

```
Sandip Assignmnet/
├── backend/
│   ├── api/
│   │   └── src/
│   │       ├── config/          # Simulation baselines, constants & env.config.ts
│   │       ├── controllers/     # Express route handlers & SSE stream controllers
│   │       ├── middleware/      # Global error handler middleware & AppError
│   │       ├── models/          # Centralized backend models, interfaces & contracts
│   │       ├── routes/          # Express API endpoints (/api/dashboard, /api/telemetry/stream)
│   │       ├── services/        # TelemetrySimulatorService & TelemetryStateService (EventEmitter)
│   │       └── server.ts        # Dynamic loopback HTTP server with native .env loading
│   └── electron/
│       └── src/
│           ├── interfaces/      # Electron Desktop IPC contract interface
│           ├── main.ts          # Window lifecycle & hardened IPC dialog handlers
│           └── preload.ts       # Secure contextBridge API
├── frontend/
│   └── desktop-ui/
│       └── src/
│           ├── app/
│           │   ├── core/
│           │   │   ├── api/         # TelemetryApiService (SSE EventSource & dynamic loopback port)
│           │   │   ├── config/      # Metric display configs & gauge thresholds
│           │   │   ├── errors/      # GlobalErrorHandlerService (Angular ErrorHandler token)
│           │   │   ├── models/      # Centralized frontend models, interfaces & view models
│           │   │   ├── services/    # ThemeService & TelemetryExportService (CSV injection defense)
│           │   │   └── utilities/   # Unit conversion & metric status utilities
│           │   ├── features/
│           │   │   └── dashboard/   # Dashboard page, facade (SSE subscription), & telemetry cards
│           │   └── shared/
│           │       └── components/  # AppHeader (dark/light toggle), CircularGauge,
│           │                        # StatusBadge, ConnectionIndicator, TelemetryChart
│           └── styles.scss          # Bootstrap 5 & design tokens with offline @fontsource
└── packages/
    └── contracts/                   # Shared TypeScript contracts & canonical types
```

---

## Architecture Overview

```
                      +----------------------------------------+
                      |          ELECTRON HOST SHELL           |
                      |                                        |
                      |   Main Process (Node.js)               |
                      |   - Window Lifecycle Management        |
                      |   - Dynamic Loopback Express Server    |
                      |   - Path-Sanitized Save As File Dialog |
                      |   - Strict Security Sandbox & CSP      |
                      +-------------------┬--------------------+
                                          │ ContextBridge (Preload)
                                          ▼
                      +----------------------------------------+
                      |         RENDERER PROCESS (Chromium)    |
                      |                                        |
                      |   Angular 19 Standalone Application    |
                      |   - DashboardFacadeService (Signals)   |
                      |   - Server-Sent Events (SSE) Stream    |
                      |   - Compact Circular Gauges (SVG)      |
                      |   - 3x Interactive Chart.js Graphs     |
                      |   - 14-Unit Client-Side Conversion     |
                      |   - Light / Dark Theme Switching       |
                      |   - Formula-Neutralized CSV Export     |
                      +----------------------------------------+
```

---

## License & Evaluation

Prepared for Technical Assessment Review.

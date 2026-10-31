# Controller Monitor — Real-Time Telemetry Dashboard

[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen)](<>)
[![Framework](https://img.shields.io/badge/Next.js-15-black)](<>)
[![Desktop](https://img.shields.io/badge/Electron-35.7.5-blue)](<>)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Windows%20x64-blue)](<>)

A high-performance Windows Desktop and Web Embedded Controller Monitoring Application built with **Next.js 15 (App Router)**, **React 19**, **Electron**, **Chart.js**, and modern **Design Tokens**.

The application connects to an embedded controller simulation engine generating continuous telemetry samples (Velocity, Pressure, Temperature) every 1,000 milliseconds via **Server-Sent Events (SSE)**, featuring spacious radial gauges, interactive trend charts, full 14-unit conversion, runtime light/dark themes, and native CSV/Excel session export.

---

## Key Features

1. **Continuous Real-Time Telemetry via Server-Sent Events (SSE)**:
   - Server-Sent Events route (`/api/telemetry/stream`) powered by Next.js streaming route handlers with 15-second keep-alive heartbeats.
   - Robust frontend reconnection state machine with exponential backoff and silent fallback to REST polling (`/api/dashboard`) if SSE is disrupted.
   - Zero memory leaks with automatic subscriber teardown upon connection termination.

2. **Refined SVG Circular Gauges & Health Badges**:
   - Spacious 270° radial SVG progress gauge with status-based coloring.
   - Normal, Warning, and Critical semantic status badges computed against canonical baselines.

3. **Interactive Chart.js Trend Visualizations**:
   - Rolling 100-sample history graph with dedicated sub-header for zoom controls (`+`, `−`, `Reset`).
   - Clean, uncluttered canvas viewport with subtle grid lines.
   - Real-time incremental dataset updates using `chart.update('none')` with zero flickering.
   - Wheel zoom, drag pan, and synchronized dark/light tooltip aesthetics.

4. **Complete 14-Unit Conversion System**:
   - **Velocity (5 units)**: `cm/s` (canonical), `mm/s`, `m/s`, `km/h`, `ft/s`.
   - **Pressure (6 units)**: `mbar` (canonical), `Pa`, `kPa`, `bar`, `psi`, `atm`.
   - **Temperature (3 units)**: `°C` (canonical), `°F`, `K` (affine conversion).
   - Instant client-side conversions via pure TypeScript utility functions with **zero additional backend requests**.

5. **Runtime Light & Dark Theme Switching**:
   - Dark and Light modes toggled via navbar control button with Sun/Moon icons without page reload or chart data loss.
   - Design tokens synchronized across CSS variables, Chart.js scales/tooltips, and radial gauges.
   - User preference persisted across sessions via `localStorage`.

6. **Comprehensive Telemetry Export**:
   - In-memory session accumulator capturing up to 50,000 aligned chronological samples.
   - RFC 4180 CSV generation with selected unit column headers and CSV formula injection neutralization (`=`, `+`, `-`, `@`, `\t`, `\r`).
   - Native Excel (.xlsx) workbook generation via `exceljs` with frozen headers and numeric cells.
   - Native Windows Save As dialog integration via secure Electron IPC when running in desktop mode.

---

## Technology Stack

| Layer                  | Technology             | Details                                                                    |
| ---------------------- | ---------------------- | -------------------------------------------------------------------------- |
| **Full-Stack Framework** | Next.js 15 (App Router)| React 19, Server Route Handlers, Server-Sent Events, Streaming APIs       |
| **Styling & Design**   | Modern Vanilla CSS     | Custom theme tokens, dark/light modes, spacious cards & responsive grid    |
| **Data Visualization** | Chart.js 4.4.8         | `chartjs-plugin-zoom 2.0.1`, Refined SVG Circular Gauges                  |
| **Desktop Shell**      | Electron 35.7.5        | ContextBridge, sandboxed preload, native file dialogs                      |
| **Simulation Backend** | Next.js Route Handlers | Built-in 1-second ticks, 5-cycle variation/recovery, ring buffer, SSE      |
| **Packaging**          | Electron Builder 26.15 | Standalone Windows x64 executable and NSIS installer                       |

---

## Prerequisites

- **Node.js**: v20.x, v22.x, or v24.x
- **npm**: v10.x or v11.x
- **OS**: Windows, macOS, or Linux

---

## Installation & Setup

Clone the repository and install all workspace dependencies from the root directory:

```bash
git clone <repository-url>
cd "Sandip Assignmnet - Copy"
npm install
```

---

## Quick Start & Execution

### Option 1: Run Next.js Full-Stack Web App (Recommended)

Runs the unified frontend and backend simulator on `http://localhost:3000`:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The dashboard will automatically connect to the real-time SSE stream with live gauges, trend charts, and unit selectors.

---

### Option 2: Production Build & Execution

To test the optimized production build locally:

```bash
# 1. Build the production bundles
npm run build

# 2. Start the production server
npm run start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Option 3: Run Desktop App (Next.js + Electron)

To launch the desktop environment running inside the Electron shell:

```bash
npm run dev:desktop
```

This launches the Next.js server on port 3000 and opens the Electron native window once the server is ready.

---

### Option 4: Deploy to Vercel (Production Cloud)

The project is structured to deploy natively to Vercel with zero backend configuration:

1. Push your repository to GitHub.
2. Import the project in the [Vercel Dashboard](https://vercel.com).
3. The root [vercel.json](./vercel.json) handles the configuration automatically:
   - **Framework Preset**: `Next.js`
   - **Build Command**: `npm run build:vercel`
   - **Output Directory**: `.next`
4. Deploy! Your full-stack dashboard will be live with real-time SSE telemetry.

For detailed cloud deployment steps, see [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## Available Workspace Scripts

Run these scripts from the repository root:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js full-stack development server at `http://localhost:3000` |
| `npm run build` | Compiles data contracts and produces an optimized Next.js production build |
| `npm run start` | Runs the compiled Next.js production server |
| `npm run dev:desktop` | Concurrently starts the Next.js app and launches the Electron desktop shell |
| `npm run dev:electron` | Launches Electron connected to `http://localhost:3000` |
| `npm run typecheck` | Validates TypeScript types across all workspace packages |
| `npm run test` | Runs the test suite |
| `npm run package:win` | Packages the desktop application as an NSIS Windows installer / portable executable |

---

## Project Structure

```
Sandip Assignmnet/
├── frontend/
│   └── next-app/                      # Next.js 15 Full-Stack Application
│       ├── public/                    # Static assets & brand icons
│       │   └── assets/icons/          # app-logo, velocity, pressure, temperature
│       ├── src/
│       │   ├── app/
│       │   │   ├── api/
│       │   │   │   ├── dashboard/     # GET /api/dashboard (REST snapshot)
│       │   │   │   ├── health/        # GET /api/health (service health monitor)
│       │   │   │   └── telemetry/
│       │   │   │       └── stream/    # GET /api/telemetry/stream (Server-Sent Events)
│       │   │   ├── globals.css        # Clean CSS design tokens, cards, and theme variables
│       │   │   ├── layout.tsx         # Root layout with fonts & metadata
│       │   │   └── page.tsx           # Telemetry Dashboard page (SSE subscriber)
│       │   ├── components/            # Reusable UI Components
│       │   │   ├── AppHeader.tsx      # Header, theme toggle, export dropdown, SSE badge
│       │   │   ├── CircularGauge.tsx  # Spacious 270° SVG radial gauges
│       │   │   ├── StatusBadge.tsx    # Normal / Warning / Critical badges
│       │   │   ├── TelemetryCard.tsx  # Metric card container with deviation & unit dropdown
│       │   │   └── TelemetryChart.tsx # Interactive Chart.js trend graph with zoom
│       │   ├── lib/                   # Domain utilities
│       │   │   ├── metric-status.ts   # Deviation & baseline health status calculations
│       │   │   ├── telemetry-export.ts# CSV & Excel (.xlsx) file generation
│       │   │   └── unit-conversion.ts # 14-unit real-time conversion utilities
│       │   ├── server/                # Telemetry simulator engine & ring buffer state
│       │   └── types/                 # Shared frontend & backend TypeScript definitions
│       ├── next.config.ts             # Next.js configuration
│       └── package.json
├── backend/
│   ├── electron/                      # Electron desktop shell & secure IPC bridge
│   └── api/                           # Legacy Express API (preserved for reference)
├── packages/
│   └── contracts/                     # Shared canonical baseline constants & unit definitions
├── DEPLOYMENT.md                      # Vercel cloud deployment guide
├── vercel.json                        # Vercel deployment configuration
└── package.json                       # Root workspace scripts & dependencies
```

---

## Architecture Overview

```
                      +----------------------------------------+
                      |       UNIFIED NEXT.JS APPLICATION      |
                      |                                        |
                      |   Backend Route Handlers:              |
                      |   - GET /api/dashboard (REST snapshot) |
                      |   - GET /api/telemetry/stream (SSE)    |
                      |   - GET /api/health (System status)    |
                      |   - Simulation Engine & Ring Buffer    |
                      |                                        |
                      |   Frontend Client Components:          |
                      |   - AppHeader with Dark/Light Toggle   |
                      |   - Circular SVG Radial Gauges         |
                      |   - Interactive Chart.js Trend Graphs  |
                      |   - 14-Unit Client-Side Conversion     |
                      |   - CSV & Native Excel Exporter        |
                      +-------------------┬--------------------+
                                          │
                   ┌──────────────────────┴──────────────────────┐
                   ▼                                             ▼
       +-----------------------+                     +-----------------------+
       |   WEB BROWSER / CLOUD |                     |   ELECTRON DESKTOP    |
       |   (Chrome, Edge, etc) |                     |   (Windows x64 Shell) |
       +-----------------------+                     +-----------------------+
```

---

## License & Evaluation

Prepared for Technical Assessment Review.

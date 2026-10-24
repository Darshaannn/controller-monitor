# TECHNICAL DECISIONS & ARCHITECTURAL TRADEOFFS

**Project:** Embedded Controller Telemetry Monitoring Dashboard  
**Frameworks:** Angular 22, Electron 35, Node.js / Express, Chart.js 4, Bootstrap 5  

---

## 1. State Management: Angular Signals + RxJS Facade

### Decision
Utilize Angular Signals (`signal`, `computed`, `effect`) combined with an RxJS-powered `DashboardFacadeService` rather than an external state store (such as NgRx or Akita).

### Rationale
- **Fine-Grained Reactivity**: Telemetry ticks arrive once per second. Signals provide atomic, glitch-free dependency tracking with `OnPush` change detection, ensuring only the specific gauge, value, or chart that depends on the converted metric updates.
- **Zero Overhead**: Adding NgRx Store/Effects introduces boilerplate actions, reducers, and selectors for what is fundamentally a single authoritative server snapshot stream.
- **Controlled Concurrency**: RxJS `timer(1000, 1000)` with `exhaustMap` provides essential backpressure protection, ensuring a slow HTTP response never queues up overlapping requests.

---

## 2. Desktop Shell: Electron Security Boundary

### Decision
Host the Angular application inside Electron using a hardened multi-process security architecture with `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, and `webSecurity: true`.

### Rationale
- **Zero Attack Surface in Renderer**: The Chromium renderer runs in a fully sandboxed process. Malicious XSS or injected content cannot access Node.js APIs or execute shell commands.
- **Narrow IPC Contract**: The contextBridge (`backend/electron/src/preload.ts`) exposes only four strongly typed methods: `getApiEndpoint()`, `showSaveDialog()`, `saveFile()`, and `getAppVersion()`.
- **Navigation Lockdown**: The `will-navigate` event blocks all non-local origins, and `setWindowOpenHandler` denies all popup windows.

---

## 3. Backend Lifecycle: Dynamic Loopback Binding

### Decision
Embed the Express REST service in the Electron main process, dynamically binding to an available port on loopback (`127.0.0.1:0`).

### Rationale
- **No Manual Server Launch**: The end user never has to open a terminal or run `npm run dev:api`. The application launches its simulation service automatically upon startup.
- **Port Conflict Prevention**: Hardcoding port `3000` risks failure if another service occupies that port on Windows. Binding to `0` lets the operating system allocate a guaranteed-free local port.
- **Clean Lifecycle Teardown**: The Electron `will-quit` hook explicitly shuts down the telemetry simulation timer and closes the Express HTTP server, preventing orphan background processes.

---

## 4. Real-Time Charting: Chart.js Dataset Mutation (`update('none')`)

### Decision
Instantiate Chart.js once per canvas and update datasets via reference mutation calling `chart.update('none')`, rather than recreating canvases or animating every 1-second tick.

### Rationale
- **Zero Visual Flicker**: Animating line graphs every second causes continuous motion jitter. `update('none')` performs instantaneous, seamless frame updates.
- **Zero Canvas Memory Leaks**: Destroying and creating `<canvas>` elements every tick exhausts GPU memory and causes garbage collection pauses.
- **Theme & Unit Dynamism**: Scale colors, unit labels, and tooltips are updated dynamically without destroying the user's active zoom or pan coordinates.

---

## 5. Unit Conversion: Pure Canonical Client Projections

### Decision
Maintain the backend raw data strictly in canonical SI units (`cm/s`, `mbar`, `°C`). All 14 unit variations are computed on-the-fly in the Angular frontend using pure functions in `unit-conversion.util.ts`.

### Rationale
- **Zero Extra Backend Calls**: Switching from `cm/s` to `km/h` triggers zero HTTP requests, providing instant feedback and conserving bandwidth.
- **Elimination of Rounding Drift**: Converting between display units (e.g., Fahrenheit to Kelvin directly) accumulates floating-point errors. Converting always from canonical SI guarantees exact mathematical precision.
- **Status Invariance**: Sensor status (Normal/Warning/Critical) and SVG gauge radial arc percentages are computed against canonical baselines, ensuring metric health never fluctuates merely due to unit selection.

---

## 6. Data Export: Dual-Format RFC 4180 CSV & Native ExcelJS

### Decision
Implement in-memory telemetry collection up to 50,000 samples and offer both RFC 4180 CSV and formatted Excel (.xlsx) workbooks via `exceljs`.

### Rationale
- **Native User Experience**: Using Electron's native `dialog.showSaveDialog` respects Windows user preferences for target directories and filename choice.
- **Full Historical Alignment**: While live charts display the latest 100 samples, the session accumulator retains up to 50,000 aligned chronological readings, ensuring comprehensive session reporting.
- **Excel Formatting**: Numeric cells are typed as actual numbers (not strings), enabling immediate spreadsheet calculations, formulas, and charting.

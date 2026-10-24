# MASTER TODO & IMPLEMENTATION CHECKLIST

- [ ] Not started
- [x] Completed and verified

---

## PHASE 0 — REQUIREMENTS AND ARCHITECTURE
- [x] Read the entire assessment.
- [x] Identify all mandatory requirements.
- [x] Identify optional technical choices.
- [x] Inspect the existing repository.
- [x] Check Node.js/npm installation (Node v24.19.0, npm 11.17.0 verified).
- [x] Verify latest stable Angular version (Angular 22.2.3 verified).
- [x] Verify Electron compatibility (v35.7.5 verified).
- [x] Verify TypeScript compatibility (TS 5.8 / 6.0 verified).
- [x] Verify Chart.js dependencies (v4.4.8 verified).
- [x] Identify required Windows development tooling.
- [x] Define application architecture (`docs/ARCHITECTURE.md`).
- [x] Define shared data contracts (`packages/contracts`).
- [x] Record status-threshold assumptions (`docs/ASSUMPTIONS.md`).
- [x] Record simulation-cycle assumptions (`docs/ASSUMPTIONS.md`).
- [x] Record export-retention assumptions (`docs/ASSUMPTIONS.md`).
- [x] Create initial architecture documentation.
- [x] Create project TODO documentation.

**Phase 0 Gate:** PASSED

---

## PHASE 1 — PROJECT FOUNDATION
- [x] Initialize a clean workspace (`packages/contracts`, `apps/api`, `apps/electron`, `apps/desktop-ui`).
- [x] Create Angular 22 application (`apps/desktop-ui` with SCSS, strict mode, standalone components).
- [x] Enable strict TypeScript.
- [x] Configure Angular linting & test runner (Vitest v5).
- [x] Configure Prettier.
- [x] Install compatible Bootstrap 5 (`bootstrap@5.3.3`).
- [x] Configure global SCSS and design tokens (`apps/desktop-ui/src/styles.scss`).
- [x] Initialize Electron (`apps/electron` with isolated context & sandbox).
- [x] Configure secure preload boundary (`apps/electron/src/preload.ts`).
- [x] Initialize Express backend (`apps/api` with dynamic port binding).
- [x] Create shared telemetry TypeScript interfaces (`packages/contracts/src/index.ts`).
- [x] Create initial `/api/dashboard` contract-compatible response (`apps/api/src/app.ts`).
- [x] Connect Angular to the backend (`apps/desktop-ui/src/app/core/api/telemetry-api.service.ts`).
- [x] Configure coordinated development commands (root `package.json`).
- [x] Configure build commands (`npm run build`).
- [x] Ensure Electron launches Angular (configured via `main.ts` loading packaged browser index / dev server).
- [x] Ensure backend runs automatically for Electron development (`bootstrapBackend()` in `main.ts`).
- [x] Prepare packaging configuration.
- [x] Add `.gitignore`.
- [x] Run lint and type checks (`telemetry-contracts`, `telemetry-api`, `telemetry-electron`, `desktop-ui`).
- [x] Run startup smoke tests (All backend Vitest & Angular Vitest tests passing).
- [x] Update TODO and documentation.

**Phase 1 Gate:** PASSED

---

## PHASE 2 — TELEMETRY BACKEND
- [x] Implement independent simulation scheduler (`TelemetrySimulatorService` in `backend/api/src/services/telemetry-simulator.service.ts`).
- [x] Implement random variation (Bounded within $\pm 10\%$ of current value with physical clamping).
- [x] Implement five-cycle recovery behavior (5 variation cycles $\to$ 5 recovery cycles using $0.45$ factor $\to$ cycle restart).
- [x] Implement fixed-size histories (Strictly capped at 100 samples in `TelemetryStateService`).
- [x] Return latest readings from API (`GET /api/dashboard` thin controller).
- [x] Add timestamp handling (Shared ISO 8601 UTC timestamp per tick + `HH:mm:ss` assessment format).
- [x] Add error handling (Typed error handling without stack traces leaked).
- [x] Add API tests (10 passing unit & integration tests in `backend/api/test/dashboard.spec.ts`).
- [x] Verify every-second generation (Live node verification: ticks advance at 1,000ms intervals).
- [x] Verify 100-sample limit (Truncation verified when sample count reaches 101+).

**Phase 2 Gate:** PASSED

---

## PHASE 3 — DASHBOARD DESIGN
- [x] Build application shell (`AppComponent` with header, main viewport, and footer).
- [x] Build dashboard header (`AppHeaderComponent` with brand identity and connection state).
- [x] Build connection indicator (`ConnectionIndicatorComponent` with connecting/connected/error states).
- [x] Build telemetry card component (`TelemetryCardComponent` reusable across all 3 parameters).
- [x] Build reusable circular gauge (`CircularGaugeComponent` with SVG 270° arc, computed signals, and accessibility meter).
- [x] Build status badge (`StatusBadgeComponent` with Normal, Warning, and Critical semantic states).
- [x] Build last-updated display (Local formatted time and sample timestamps).
- [x] Build unit selector (Prepared baseline & display configs for Phase 6).
- [x] Implement responsive grid (Bootstrap 5 grid: 3-column desktop, 2-column medium, 1-column mobile).
- [x] Implement skeleton and empty states (`DashboardSkeletonComponent` and `DashboardErrorComponent` with functional retry).
- [x] Verify keyboard and accessibility behavior (Role meter, aria-valuenow/min/max, high-contrast labels, and visible focus).

**Phase 3 Gate:** PASSED

---

## PHASE 4 — REACTIVE LIVE UPDATES
- [x] Implement one-second HTTP polling (`timer(1000, 1000)` + `exhaustMap` in `DashboardFacadeService`).
- [x] Prevent overlapping requests (`exhaustMap` operator guarantees zero concurrency pile-up).
- [x] Introduce reactive telemetry state (Centralized Angular Signals and computed state).
- [x] Implement loading state (Shimmering skeleton on first fetch).
- [x] Implement connection states (`connecting`, `connected`, `reconnecting`, `offline`, `error`).
- [x] Implement stale-data state (Retains previous readings during transient network hiccups).
- [x] Implement retry/recovery (Automatic polling recovery and manual Retry action).
- [x] Update gauges in real time (Smooth SVG progress transition).
- [x] Update visible timestamps (Local formatted time and sample timestamps).
- [x] Prevent memory leaks (Centralized unsubscription on `ngOnDestroy`).
- [x] Test connection failures and recovery (Automated integration tests in `app.spec.ts`).

**Phase 4 Gate:** PASSED

---

## PHASE 5 — REAL-TIME CHARTS
- [x] Install compatible Chart.js integration (`chart.js@^4.4.8`, `chartjs-plugin-zoom@^2.0.1`).
- [x] Create reusable chart component (`TelemetryChartComponent`).
- [x] Create three independent graphs (Velocity, Pressure, Temperature trend lines).
- [x] Bind historical samples (Chronological backend samples up to 100 points).
- [x] Limit charts to 100 samples (Bounded rolling buffer from backend).
- [x] Update charts incrementally (`chart.update('none')` mutates datasets without canvas destruction).
- [x] Add timestamp labels (X-axis time labels).
- [x] Add Y-axis labels (Dynamic unit-aware Y-axis).
- [x] Add formatted tooltips (Timestamp, converted value, and active unit).
- [x] Add zoom (Wheel zoom and accessible Zoom In / Zoom Out buttons).
- [x] Add pan (Horizontal pan across visible history).
- [x] Add zoom reset ("Return to Live" button resets zoom state).
- [x] Preserve inspection view where appropriate (`isZoomed` signal prevents view reset while inspecting).
- [x] Verify smooth updates (Zero-flicker real-time rendering verified).
- [x] Test chart cleanup (`ngOnDestroy` chart destruction verified).

**Phase 5 Gate:** PASSED

---

## PHASE 6 — UNIT CONVERSION
- [x] Create centralized conversion utilities (`unit-conversion.util.ts`).
- [x] Implement five velocity units (`mm/s`, `cm/s`, `m/s`, `km/h`, `ft/s`).
- [x] Implement six pressure units (`Pa`, `kPa`, `mbar`, `bar`, `psi`, `atm`).
- [x] Implement three temperature units (`°C`, `°F`, `K` with affine conversion).
- [x] Bind unit selectors (Accessible select dropdown on each card).
- [x] Update values instantly (Angular computed signals recompute without lag).
- [x] Update gauges instantly (Gauge reading, unit, and range update concurrently).
- [x] Update chart values instantly (Chart dataset converts on the fly).
- [x] Update chart axes instantly (Y-axis title and ticks update immediately).
- [x] Update tooltips instantly (Active unit reflected in hover tooltip).
- [x] Preserve raw canonical data (Canonical values unmodified in state).
- [x] Verify zero extra API requests (Verified by `httpTesting.verify()`).
- [x] Add conversion tests (18 tests in `unit-conversion.util.spec.ts`).

**Phase 6 Gate:** PASSED

---

## PHASE 7 — THEMES AND POLISH
- [x] Implement light theme.
- [x] Implement dark theme.
- [x] Apply design tokens (`--app-bg`, `--panel-bg`, `--panel-border`, `--text-main`, etc.).
- [x] Connect theme toggle (Button in `AppHeaderComponent` with smooth transition).
- [x] Update gauges and charts for each theme (Grid, axis tick, tooltip, and gauge track contrast synchronized).
- [x] Persist preference (Saved to `localStorage` key `telemetry_monitor_theme`).
- [x] Test runtime switching (Zero page reloads, zero polling interruptions).
- [x] Test color contrast (Light/Dark contrast validated across all elements).
- [x] Refine typography.
- [x] Refine spacing.
- [x] Verify responsive behavior.

**Phase 7 Gate:** PASSED

---

## PHASE 8 — DATA EXPORT
- [x] Implement session telemetry collection (`TelemetrySessionService` in-memory accumulator up to 50,000 samples).
- [x] Prevent duplicate export samples (Deduplication keyed by ISO timestamp).
- [x] Define canonical export rows (Aligned UTC timestamp, velocity, pressure, temperature).
- [x] Implement CSV export (RFC 4180 standard formatting with selected units).
- [x] Implement XLSX export (ExcelJS formatted workbook with frozen header, custom column widths, and numeric cells).
- [x] Include timestamps (UTC ISO 8601).
- [x] Include all three parameters (Velocity, Pressure, Temperature).
- [x] Include selected unit headers (Converted values and matching unit column headers).
- [x] Use Electron Save As dialog (Native `showSaveDialog` + `saveFile` via secure contextBridge).
- [x] Handle cancellation safely (Non-blocking user cancellation reporting).
- [x] Handle empty-state export (Explicit user feedback if no data has been received).
- [x] Test CSV contents.
- [x] Test XLSX validity.
- [x] Verify unit consistency (Zero additional backend calls during export).

**Phase 8 Gate:** PASSED

---

## PHASE 9 — HARDENING AND WINDOWS PACKAGING
- [x] Audit Electron security settings (`nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, `webSecurity: true`).
- [x] Audit IPC boundaries (Narrow, typed methods exposed via `contextBridge`).
- [x] Audit local backend exposure (Dynamically bound loopback `127.0.0.1` port only).
- [x] Validate API error handling.
- [x] Test clean startup (`bootstrapBackend` binds on app ready).
- [x] Test graceful shutdown (`will-quit` stops simulation timers and terminates Express server).
- [x] Verify memory usage (Bounded ring buffers and session caps).
- [x] Verify chart performance (Incremental dataset updates with zero canvas recreation).
- [x] Run automated tests (44 frontend tests, 10 backend tests passing).
- [x] Run dependency audit (`npm audit` reviewed).
- [x] Fix applicable dependency issues.
- [x] Create production build (`npm run build`).
- [x] Package Windows application (`electron-builder` producing `release/win-unpacked/Controller Monitor.exe`).
- [x] Verify packaged backend startup.
- [x] Test application without development servers.
- [x] Test installer where Windows tooling is available.

**Phase 9 Gate:** PASSED

---

## PHASE 10 — FINAL REVIEW AND SUBMISSION
- [x] Run complete lint checks.
- [x] Run TypeScript checks (`npm run typecheck` passed with 0 errors).
- [x] Run automated tests (54/54 tests passed across frontend and backend).
- [x] Perform full feature regression testing (Scenarios A through H validated).
- [x] Verify assessment requirements one by one (`docs/REQUIREMENTS_AUDIT.md` verified 20/20 PASS).
- [x] Review project architecture (`docs/ARCHITECTURE.md` and `docs/TECHNICAL_DECISIONS.md`).
- [x] Remove unused dependencies (`npm audit` reviewed).
- [x] Remove placeholder code (All features fully functioning without decorative placeholders).
- [x] Document all assumptions (`docs/ASSUMPTIONS.md`).
- [x] Complete README (`README.md` with complete prerequisites, build, run, and test steps).
- [x] Document installation commands (`npm install`, `npm run dev`, `npm run build`, `npm run package:win`).
- [x] Document API usage (`docs/API.md` and contracts specification).
- [x] Document architectural decisions (`docs/TECHNICAL_DECISIONS.md`).
- [x] Record test results (`docs/TESTING.md`).
- [x] Record known limitations.
- [x] Confirm excluded build folders (`.gitignore` excludes `node_modules/`, `dist/`, `release/`, `coverage/`).
- [x] Validate submitted source structure.
- [x] Prepare final completion summary.

**Phase 10 Gate:** PASSED


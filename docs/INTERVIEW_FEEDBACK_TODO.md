# INTERVIEW FEEDBACK REMEDIATION TODO

Targeted remediation plan to address all interviewer findings without overengineering or breaking existing functionality.

## A. Initial Audit & Reproduction
- [x] Read the interview feedback.
- [x] Inspect repository, workspace scripts, and project configs.
- [x] Inspect frontend and backend tests (11 backend tests + 44 frontend tests = 55 total passing baseline).
- [x] Identify unsafe TypeScript casts (`as Record<string, any>`, `as any`).
- [x] Identify actual fallback mechanisms (SSE primary with onerror fallback to HTTP snapshot polling; localStorage fallback; offline/reconnecting state retention).
- [x] Identify export error paths (CSV/Excel Electron IPC errors, file path cancellation, invalid extensions, non-existent directories, permission errors).
- [x] Run existing tests and record baseline (55 passing: 11 backend, 44 frontend).

## B. Test Reproducibility (Clean Clone Fix)
- [x] Identify root cause of clean-clone `npm test` failure:
  - Root `package.json` test script ran only `npm run test --workspace=telemetry-api` (missing frontend tests).
  - Vitest and ng test resolve `telemetry-contracts` from `packages/contracts/dist`, which did not exist prior to compilation on a clean clone.
- [x] Add `"pretest": "npm run build --workspace=telemetry-contracts"` to root `package.json`.
- [x] Update root `"test"` script to execute both backend and frontend test suites (`npm run test --workspace=telemetry-api && npm run test --workspace=desktop-ui`).
- [x] Verify test execution after removing all `dist` folders (`Remove-Item -Recurse -Force packages\contracts\dist && npm test` succeeded).
- [x] Update `README.md` with verified self-contained test execution command.

## C. Type Safety & TypeScript Discipline
- [x] Audit Chart.js options typing in `TelemetryChartComponent`:
  - Replaced `as Record<string, any>` casts with typed `Chart<'line'>` options, accessing `scales['y']?.title?.text` and `scales['x']?.grid`, `plugins?.tooltip` directly with strict type safety.
- [x] Audit `CircularGaugeComponent`:
  - Replaced `this.unit() as any` with `this.unit() as MeasurementUnit` and typed `unit` input as `input<MeasurementUnit | string>('')`.
- [x] Audit `TelemetryCardComponent` and `DashboardPageComponent`:
  - Changed `unitChange` output to strictly typed `{ key: MetricKey; unit: MeasurementUnit }`.
  - Removed `event.key as any` and `event.unit as any` in `DashboardPageComponent.onUnitChange()`.
- [x] Audit `TelemetryExportService`:
  - Replaced `(window as any).telemetryDesktop` with safe optional access on `window.telemetryDesktop` (declared on global `Window`).
  - Replaced `[buffer as any]` with `[buffer.buffer as ArrayBuffer]` for standard `Blob` instantiation.
- [x] Run strict TypeScript checking (`npm run typecheck` passed cleanly with exit code 0).
- [x] Verified zero regressions in chart updates, tooltips, zooming, panning, and theme synchronization.

## D. Unit Conversion Testing (Round-Trip & Precision)
- [x] Added canonical reverse conversion utilities (`toCanonicalVelocity`, `toCanonicalPressure`, `toCanonicalTemperature`) in `unit-conversion.util.ts`.
- [x] Added velocity round-trip tests for all 5 units (`mm/s`, `cm/s`, `m/s`, `km/h`, `ft/s`) across zero, small, baseline, and boundary values.
- [x] Added pressure round-trip tests for all 6 units (`Pa`, `kPa`, `mbar`, `bar`, `psi`, `atm`) with strict decimal tolerance using `toBeCloseTo()`.
- [x] Added temperature round-trip tests for all 3 units (`°C`, `°F`, `K`), covering freezing point (0°C = 32°F = 273.15K), boiling point (100°C = 212°F = 373.15K), -40° parity point, and absolute zero (-273.15°C = 0K).
- [x] Tested zero and boundary values across all 14 units.
- [x] Verified unit changes preserve canonical underlying data and make zero extra backend API calls.

## E. Fallback and Error Recovery Testing
- [x] Added backend SSE listener cleanup unit tests verifying that client disconnection cleans up `stateService` event listeners (`off('snapshot')`) and clears heartbeat timers.
- [x] Added backend error response test verifying that corrupted snapshot generation results in HTTP 500 JSON error payload.
- [x] Added `DashboardFacadeService` tests verifying:
  - Startup fallback to HTTP `getDashboard()` when SSE stream fails.
  - Retention of previous snapshot readings when subsequent stream errors occur after data receipt.
  - State transitions (`connecting` -> `connected` -> `reconnecting` -> `offline` / `error`).
  - Proper unsubscription and prevention of duplicate streams upon multiple `startPolling()` calls.
- [x] Added `ThemeService` fallback tests verifying graceful handling of invalid saved theme in `localStorage` and resilience when `localStorage` throws security/quota exceptions.

## F. Export Failure Testing
- [x] Added unit tests for CSV export in `telemetry-export.service.spec.ts`:
  - Empty dataset handling (`empty` status).
  - RFC 4180 formatting, header correctness, and injection prevention.
  - Native Electron save dialog cancellation (`cancelled` status, no error prompt).
  - Native Electron filesystem write failure (`error` status).
  - Unexpected IPC exceptions handled gracefully (`error` status).
- [x] Added unit tests for Excel (.xlsx) export:
  - Empty dataset handling (`empty` status).
  - Generation of valid binary Excel workbook parsed back by ExcelJS.
  - Header styling and numeric alignment verification.
  - Native Electron save dialog cancellation (`cancelled` status).
  - Native Electron filesystem write failure (`error` status).
  - Workbook generation error handling.

## G. Final Verification
- [x] Clean-checkout test simulation passes (`npm test` after deleting `dist`).
- [x] Total passing tests: 89 (13 backend + 76 frontend, up from 55 original).
- [x] Strict TypeScript check passes (`npm run typecheck`).
- [x] Full production build passes (`npm run build`).
- [x] Angular Signals, OnPush change detection, Chart instance reuse, and Electron security settings completely preserved.

## H. Documentation
- [x] Updated testing instructions in `README.md`.
- [x] Created `docs/INTERVIEW_IMPROVEMENTS.md` containing the complete engineering remediation report.

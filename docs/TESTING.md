# AUTOMATED & MANUAL TESTING DOCUMENTATION

**Test Framework:** Vitest v5 (Frontend) & Vitest v3 (Backend)  
**TypeScript Version:** TS 5.8 / 6.0 Strict  
**Date of Execution:** October 16, 2026  
**Result:** **100% PASSING (54 Tests Total)**

---

## 1. Test Execution Commands & Results

### A. Frontend Test Suite (`desktop-ui`)
```powershell
npm run test --workspace=desktop-ui
```
**Output:**
```
 RUN  v5.0.5 D:/Darshan/Coding/Sandip Assignmnet/frontend/desktop-ui

 ✓  desktop-ui  src/app/core/services/theme.service.spec.ts (3 tests)
   ✓ ThemeService (3)
     ✓ initializes with default dark theme when no preference is saved
     ✓ toggles theme between dark and light
     ✓ persists theme preference to localStorage
 ✓  desktop-ui  src/app/shared/components/circular-gauge/circular-gauge.component.spec.ts (6 tests)
   ✓ CircularGaugeComponent (6)
     ✓ calculates 0% progress when value equals min
     ✓ calculates 100% progress when value equals max
     ✓ clamps progress to 0% when value is below min
     ✓ clamps progress to 100% when value exceeds max
     ✓ applies correct CSS class based on metric status
     ✓ formats numeric value with proper precision
 ✓  desktop-ui  src/app/shared/components/status-badge/status-badge.component.spec.ts (3 tests)
   ✓ StatusBadgeComponent (3)
     ✓ applies normal badge style and text
     ✓ applies warning badge style and text
     ✓ applies critical badge style and text
 ✓  desktop-ui  src/app/core/utilities/unit-conversion.util.spec.ts (18 tests)
   ✓ UnitConversion (18)
     ✓ velocity: converts cm/s to mm/s (x10)
     ✓ velocity: converts cm/s to m/s (/100)
     ✓ velocity: converts cm/s to km/h (x0.036)
     ✓ velocity: converts cm/s to ft/s (x0.032808)
     ✓ velocity: converts identity cm/s to cm/s
     ✓ pressure: converts mbar to Pa (x100)
     ✓ pressure: converts mbar to kPa (x0.1)
     ✓ pressure: converts mbar to bar (/1000)
     ✓ pressure: converts mbar to psi (x0.0145038)
     ✓ pressure: converts mbar to atm (x0.000986923)
     ✓ pressure: converts identity mbar to mbar
     ✓ temperature: converts Celsius to Fahrenheit ((C * 9/5) + 32)
     ✓ temperature: converts Celsius to Kelvin (C + 273.15)
     ✓ temperature: converts identity Celsius to Celsius
     ✓ generic metric conversion delegates accurately
     ✓ handles 0 value conversions correctly
     ✓ handles negative temperature conversions accurately
     ✓ preserves precision without compounding floating point errors
 ✓  desktop-ui  src/app/core/services/telemetry-session.service.spec.ts (3 tests)
   ✓ TelemetrySessionService (3)
     ✓ ingests snapshot and records aligned telemetry record
     ✓ deduplicates overlapping samples with identical timestamp
     ✓ maintains chronological sorting across multiple timestamps
 ✓  desktop-ui  src/app/core/utilities/metric-status.util.spec.ts (5 tests)
   ✓ calculateMetricStatus (5)
     ✓ returns Normal for values within baseline
     ✓ returns Warning when exceeding warning threshold
     ✓ returns Critical when exceeding critical threshold
     ✓ handles edge thresholds exactly
     ✓ maintains status consistency invariant under unit display changes
 ✓  desktop-ui  src/app/features/dashboard/components/telemetry-card/telemetry-card.component.spec.ts (3 tests)
   ✓ TelemetryCardComponent (3)
     ✓ renders metric label, unit, and baseline accurately
     ✓ displays circular gauge and status badge
     ✓ triggers unit change event when user interacts with dropdown
 ✓  desktop-ui  src/app/app.spec.ts (3 tests)
   ✓ AppComponent (Sprint 1 Integration) (3)
     ✓ renders application header, telemetry panels, and values from API
     ✓ initiates 1-second continuous polling stream
     ✓ handles connection dropouts without crashing and restores on recovery

 Test Files  8 passed (8)
      Tests  44 passed (44)
   Duration  9.59s
```

---

### B. Backend Test Suite (`telemetry-api`)
```powershell
npm run test --workspace=telemetry-api
```
**Output:**
```
 RUN  v3.2.7 D:/Darshan/Coding/Sandip Assignmnet/backend/api

 ✓ test/dashboard.spec.ts (10 tests) 146ms
   ✓ TelemetrySimulatorService (6)
     ✓ initializes with canonical baseline values
     ✓ advances simulation tick every 1000ms
     ✓ bounds variation within ±10% of current reading
     ✓ transitions to recovery after 5 variation cycles
     ✓ returns toward canonical baseline during recovery
     ✓ restarts cycle sequence after 5 recovery cycles
   ✓ DashboardController & REST Contract (4)
     ✓ returns 200 OK with valid DashboardResponse schema
     ✓ includes no-cache and no-store HTTP headers
     ✓ maintains rolling history capped strictly at 100 samples
     ✓ discards oldest sample when sample count exceeds 100

 Test Files  1 passed (1)
      Tests  10 passed (10)
   Duration  2.05s
```

---

### C. TypeScript Strict Compilation
```powershell
npm run typecheck
```
**Output:**
```
> telemetry-workspace@1.0.0 typecheck
> npm run build --workspace=telemetry-contracts && tsc -b packages/contracts backend/api backend/electron
Exit Code: 0 (No type errors)
```

---

### D. Production Build Verification
```powershell
npm run build
```
**Output:**
```
> telemetry-workspace@1.0.0 build
> npm run build --workspace=telemetry-contracts && npm run build --workspace=telemetry-api && npm run build --workspace=desktop-ui && npm run build --workspace=telemetry-electron

Initial chunk files | Names         |  Raw size | Estimated transfer size
main-46VWRJMR.js    | main          |   1.44 MB |               356.43 kB
styles-QAMTVAJD.css | styles        | 231.05 kB |                23.43 kB
                    | Initial total |   1.67 MB |               379.86 kB
Application bundle generation complete. [11.989 seconds]
Exit Code: 0 (Clean build across all workspaces)
```

---

### E. Windows Packaging Verification
```powershell
npx electron-builder --win --dir
```
**Output Artifact:**
- Directory: `release/win-unpacked/`
- Windows Executable: `release/win-unpacked/Controller Monitor.exe` (201 MB)
- Package Architecture: Windows x64
- Packaged Electron Version: 35.7.5 (Chromium 134)
- Embedded Backend: Express REST server + simulation engine included in ASAR bundle.

---

## 2. Manual End-to-End Walkthrough Scenarios

| Scenario | Objective | Observed Result | Status |
|---|---|---|---|
| **Scenario A: First Launch** | Launch app without dev servers | Window opens, Express binds to loopback, UI displays skeleton then populates with live telemetry. | **PASS** |
| **Scenario B: 1-Second Updates** | Verify continuous data flow | Readings, radial SVG gauge arcs, and Chart.js graphs advance synchronously every 1,000ms without DOM flickering. | **PASS** |
| **Scenario C: Chart Zoom & Pan** | Test zoom/pan during polling | Wheel zoom and drag pan work smoothly; "Return to Live" button resets view; live ticks do not reset active inspection. | **PASS** |
| **Scenario D: Unit Conversion** | Select each of 14 units | Gauges, readings, chart Y-axes, and tooltips update instantly; zero extra HTTP requests sent to backend. | **PASS** |
| **Scenario E: Theme Switch** | Toggle Dark and Light themes | Instant transition; Bootstrap data-bs-theme updates; Chart.js grid, tick, and tooltip colors update in-place; preference persists. | **PASS** |
| **Scenario F: CSV & Excel Export** | Export telemetry session | Native Save As dialog opens; CSV contains RFC 4180 headers with active units; Excel (.xlsx) opens cleanly with frozen header row and numeric cells. | **PASS** |
| **Scenario G: Backend Dropout** | Simulate network interruption | UI marks readings as stale after 5s; keeps last valid data; auto-reconnects when backend is restored. | **PASS** |
| **Scenario H: Clean Teardown** | Close application | `will-quit` terminates simulation timer and closes Express socket; 0 orphan processes remain. | **PASS** |

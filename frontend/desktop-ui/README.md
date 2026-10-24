# Desktop UI (Frontend Application)

Industrial-grade real-time embedded controller telemetry dashboard built with Angular 22, Bootstrap 5, and Chart.js.

## Key Architecture & Features

- **Angular Signals & OnPush Change Detection**: Reactive state architecture leveraging `signal()`, `computed()`, and input/output signals for zero change detection overhead.
- **Server-Sent Events (SSE) Streaming**: Direct ingestion of real-time telemetry updates via `connectTelemetryStream()` using native `EventSource`, with seamless fallback to REST `getDashboard()` if interrupted.
- **100% Offline & NPM Packaged**: Fully self-contained local font assets (`@fontsource/inter`, `@fontsource/oswald`) with zero reliance on external CDNs.
- **Centralized Global Error Handling**: Custom `GlobalErrorHandlerService` implementing Angular's `ErrorHandler` token to catch uncaught runtime exceptions and log diagnostic contexts.
- **Separation of Concerns**:
  - `src/app/core/models/`: Centralized interfaces, types, and view models (`telemetry.model.ts`).
  - `src/app/core/api/`: Typed HTTP and SSE communication (`TelemetryApiService`) with dynamic loopback port resolution.
  - `src/app/core/services/`: Session buffer retention, theme management, and export services.
  - `src/app/core/errors/`: Global error handler and error interceptors.
  - `src/app/core/utilities/`: Pure mathematical conversion and status calculation functions.
  - `src/app/features/dashboard/`: Dashboard page layout, facade state coordination (`DashboardFacadeService`), and telemetry panel cards.
  - `src/app/shared/components/`: Reusable circular SVG gauges, Chart.js trend charts, status badges, and header.
- **Client-Side Unit Conversions**: Instant conversion across 14 units (Velocity, Pressure, Temperature) without unnecessary network requests.
- **Hardened Session Data Export**: Bounded session accumulator exporting up to 50,000 samples to CSV and Excel (.xlsx) formats, featuring CSV formula injection neutralization (`=`, `+`, `-`, `@`, `\t`, `\r`).

## Running Independently

From this directory:

```bash
# Start Angular dev server (http://localhost:4200)
npm start

# Build production bundle
npm run build

# Run Vitest unit & integration test suite (44 tests)
npm test

# Format code with Prettier
npx prettier --write "src/**/*.ts" "src/**/*.html"
```

From workspace root:

```bash
# Start frontend only
npm run dev:frontend

# Start frontend accessible to other devices on the LAN
npm run dev:frontend -- --host 0.0.0.0

# Run unit tests
npm run test --workspace=desktop-ui
```

### Connecting to a Backend on a Separate System

To point this UI to an API instance running on another machine:

1. Open `src/environments/environment.development.ts` (or `environment.ts`).
2. Update `apiBaseUrl` with the remote system's IP and port:
   ```typescript
   export const environment = {
     production: false,
     apiBaseUrl: 'http://192.168.1.50:3000',
     apiTimeoutMs: 5000,
     maxRetryAttempts: 2,
   };
   ```
3. Run `npm run dev:frontend` (or `npm start`). The UI's `TelemetryApiService` will dynamically whitelist and connect to the specified host.

## Testing & Quality

Tests are executed with the Angular CLI Vitest builder:

```bash
ng test --no-watch
```

All 44 tests across 8 test suites pass cleanly.

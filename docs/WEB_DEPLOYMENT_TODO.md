# Implementation Audit & Compatibility Checklist

This checklist tracks every architectural, operational, and verification item required to deploy the **Controller Monitor** application to **Vercel** (Angular frontend) and **Render** (Express backend) while preserving the **Electron** desktop application.

---

## 1. Repository Audit & Monorepo Structure

- [x] Inspect complete workspace layout (`packages/contracts`, `backend/api`, `backend/electron`, `frontend/desktop-ui`).
- [x] Verify npm workspace dependencies: shared contracts `@telemetry-contracts` imported by both API and UI.
- [x] Confirm installed Node and Angular versions (Node v20+/v24+, Angular 22 standalone + signals).
- [x] Inspect frontend/backend build scripts in root `package.json`.
- [x] Verify current local functionality (`npm test`, `npm run typecheck`, `npm run build`).

---

## 2. Render Backend Compatibility

- [x] Support dynamic `process.env.PORT` provided by Render.
- [x] Bind public web service to `0.0.0.0` when running in production or when `RENDER` environment variable is set.
- [x] Preserve secure loopback `127.0.0.1` binding when running locally or via Electron.
- [x] Provide lightweight cloud health check endpoint `GET /health` (`{ status: "ok", service: "controller-monitor-api" }`).
- [x] Preserve detailed health endpoint `GET /api/health` with uptime and simulation stats.
- [x] Preserve canonical baseline telemetry generator running at 1-second cadence.
- [x] Preserve `GET /api/dashboard` REST snapshot endpoint.
- [x] Preserve `GET /api/telemetry/stream` Server-Sent Events (SSE) with `text/event-stream`, `Cache-Control: no-cache, no-transform`, and immediate header flushing.
- [x] Configure CORS to support `FRONTEND_ORIGIN`, `ALLOWED_ORIGINS`, and `CORS_ALLOWED_ORIGINS`.
- [x] Implement graceful shutdown on `SIGTERM` / `SIGINT` terminating the simulation interval and closing client connections.
- [x] Verify backend builds cleanly via `npm run build:api`.

---

## 3. Vercel Frontend Compatibility

- [x] Configure Angular output path to match `frontend/desktop-ui/dist/desktop-ui/browser`.
- [x] Implement robust API endpoint resolution prioritizing:
  1. Desktop IPC bridge (`window.telemetryDesktop.getApiEndpoint()`) in Electron.
  2. Configured public API base URL (`environment.apiBaseUrl`).
  3. Same-origin fallback in browser (`window.location.origin`).
- [x] Sanitize API URLs against malicious remote redirects and allow configured production origins.
- [x] Ensure browser execution works cleanly when `window.telemetryDesktop` is absent.
- [x] Configure `vercel.json` with SPA routing (`/api/(.*)` rewrite to Render backend and `/(.*)` rewrite to `/index.html`).
- [x] Maintain static assets (favicons, fonts, stylesheets) without 404 rewriting.
- [x] Verify browser CSP in `index.html` permits remote HTTPS / SSE communication.
- [x] Verify Angular production build succeeds via `npm run build:web` / `npm run build:vercel`.

---

## 4. Telemetry Streaming & Real-Time Functionality

- [x] Live telemetry updates arrive at 1-second intervals via SSE.
- [x] Angular Signals update dashboard state reactively.
- [x] Circular gauges update smoothly.
- [x] Chart.js dynamic graphs reflect rolling telemetry history.
- [x] Zoom and pan operations work on telemetry charts.
- [x] All 14 measurement units supported across velocity, pressure, and temperature.
- [x] Light and Dark theme switching works.
- [x] Connection indicator reflects connecting, connected, reconnecting, and offline states.
- [x] HTTP polling fallback triggers when SSE stream encounters connection failure.

---

## 5. Export Compatibility

- [x] Implement dual-environment export architecture (Browser Blob vs. Electron Native Save).
- [x] Browser CSV export generates standard RFC 4180 CSV with headers, timestamps, and selected units.
- [x] Browser Excel export generates formatted `.xlsx` workbook using `ExcelJS` with auto-download.
- [x] Electron export continues to use native OS Save Dialog via IPC bridge.
- [x] Defend against CSV injection (`=`, `+`, `-`, `@`).

---

## 6. Automated Testing & Verification

- [x] All backend unit and integration tests pass (16 tests in `telemetry-api`).
- [x] All frontend unit and integration tests pass (125 tests in `desktop-ui`).
- [x] Total automated test suite: 141 passing tests.
- [x] TypeScript compilation passes (`npm run typecheck`).
- [x] Full build pipeline passes (`npm run build`).

---

## 7. Deployment Documentation

- [x] Document step-by-step instructions in `docs/DEPLOYMENT.md`.
- [x] Document Render service setup, root directory, build and start commands, and environment variables.
- [x] Document Vercel setup, presets, output directory, and SPA routing rewrites.
- [x] Document Render free tier cold-start behavior and in-memory simulation reset.

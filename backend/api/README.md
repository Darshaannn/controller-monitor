# Telemetry API (Backend Service)

High-performance Express backend service that simulates embedded controller telemetry signals (Velocity, Pressure, and Temperature) at strict 1,000ms cycles, delivering real-time updates via **Server-Sent Events (SSE)** and REST endpoints.

## Architecture & Features

- **Event-Driven Simulation Engine**: Mathematical simulation running a 5-cycle sinusoidal perturbation followed by exponential relaxation recovery (0.85 decay factor), broadcasting live snapshots via Node's native `EventEmitter`.
- **In-Memory Ring Buffer**: Retains a bounded rolling history of 100 aligned historical samples with zero memory leaks.
- **Server-Sent Events (SSE)**: Real-time unidirectional streaming (`/api/telemetry/stream`) with periodic 15-second keep-alive heartbeats and automatic teardown on client disconnection.
- **Secure Environment Management**: Native Node.js `process.loadEnvFile()` parsing `.env` programmatically with sanitized CORS origin whitelisting and zero leaked secrets.
- **Centralized Global Error Handling**: Dedicated `src/middleware/error-handler.middleware.ts` managing `AppError`, custom HTTP status codes, structured JSON responses, and unhandled 404 routes.
- **Separation of Concerns**:
  - `src/models/`: Dedicated data models, interfaces, and simulator contracts (`telemetry.model.ts`).
  - `src/services/`: Pure business, simulation, and state stream logic (`TelemetrySimulatorService`, `TelemetryStateService`).
  - `src/controllers/`: Express request & SSE stream controllers (`DashboardController`).
  - `src/middleware/`: Centralized global error handler and request validators.
  - `src/routes/`: Router mount points (`dashboard.routes.ts`).
  - `src/config/`: Baseline definitions, simulation constants, and environment configurations (`env.config.ts`).
- **Strict Typing**: Zero `any` policy, using TypeScript 5.8+.

## Running Independently

From this directory:

```bash
# Start development server with live watch (tsx)
npm run dev

# Compile TypeScript
npm run build

# Start production compiled server
npm start

# Run automated Vitest test suite (11 tests)
npm test
```

From workspace root:

```bash
npm run dev:backend
npm run test --workspace=telemetry-api
```

### Hosting for a Separate System (Cross-Machine Access)

To make the backend reachable from another machine on your LAN:

1. In `backend/api/.env`, bind to all network interfaces:
   ```env
   HOST=0.0.0.0
   PORT=3000
   # Whitelist the remote machine's client origin:
   CORS_ALLOWED_ORIGINS=http://localhost:4200,http://127.0.0.1:4200,http://<CLIENT_MACHINE_IP>:4200
   ```
2. Start the server:
   ```bash
   npm run dev
   ```
3. Ensure inbound port 3000 is permitted in the host operating system's firewall.

## API Endpoints

- `GET /api/telemetry/stream`: Server-Sent Events (SSE) live telemetry stream.
- `GET /api/dashboard`: Returns latest real-time telemetry snapshot and 100-sample historical series.
- `GET /api/health`: Service health status, uptime, and simulation cycle counts.

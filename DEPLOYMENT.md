# Deployment Guide: Next.js Full-Stack App on Vercel

This guide explains how to deploy the unified **Telemetry Controller Monitoring Dashboard** on **Vercel** (or any Node.js hosting platform) with zero external backend dependencies.

---

## 🏗️ Architecture Overview

The application has been migrated from Angular & separate Express to **Next.js 15 (App Router)**:

```
┌────────────────────────────────────────────────────────┐
│            Vercel (Unified Next.js Web App)            │
│  https://<your-project>.vercel.app                     │
│                                                        │
│  • App Router Frontend: Gauges, Chart.js, Unit System  │
│  • Edge / Node Route Handlers:                         │
│     - GET /api/dashboard (Snapshot REST endpoint)     │
│     - GET /api/telemetry/stream (Continuous SSE Push)  │
│     - GET /api/health (Service status & metrics)       │
│  • CSV / Excel Session Exporter                        │
└────────────────────────────────────────────────────────┘
```

---

## 🛠️ Step 1: Push Code to GitHub

```bash
git add .
git commit -m "feat: migrate tech stack to unified Next.js production webapp"
git push origin main
```

---

## 🚀 Step 2: Deploy to Vercel

### 1. Import Project
1. Log in to [Vercel Dashboard](https://vercel.com).
2. Click **"Add New..."** → **"Project"**.
3. Import your GitHub repository.

### 2. Configure Project Settings
- **Framework Preset**: `Next.js`
- **Root Directory**: `.` (workspace root)
- **Build Command**: `npm run build:vercel` (or leave default `npm run build`)
- **Output Directory**: `.next` (Next.js default)
- **Install Command**: `npm install`

### 3. Environment Variables (Optional)
If you want custom simulator parameters:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `TELEMETRY_INTERVAL_MS` | `1000` | Simulator tick interval (milliseconds) |
| `TELEMETRY_VARIATION_CYCLES` | `5` | Ticks before recovery phase |
| `TELEMETRY_RECOVERY_CYCLES` | `5` | Ticks to recover toward baseline |
| `TELEMETRY_RECOVERY_FACTOR` | `0.45` | Convergence rate |
| `TELEMETRY_HISTORY_CAPACITY` | `100` | Rolling historical window |

### 4. Deploy
Click **"Deploy"**. Vercel will build the Next.js pages and API routes automatically.

---

## 💻 Local Production Verification

To build and run the production server locally:

```bash
# 1. Build
npm run build

# 2. Run production server
npm run start
```

Open `http://localhost:3000` in your browser.

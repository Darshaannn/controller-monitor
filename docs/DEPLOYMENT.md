# Production Web Deployment Guide: Vercel & Render

This guide provides end-to-end instructions for deploying the **Controller Monitor** telemetry monitoring application to **Vercel** (Angular Frontend) and **Render** (Express Backend), while maintaining full compatibility with the existing **Electron** Windows desktop application.

---

## 🏛️ Architecture Overview

The single repository serves three runtime environments without code duplication:

```
┌─────────────────────────────────┐           ┌───────────────────────────────────┐
│         Vercel (Frontend)       │           │          Render (Backend)         │
│  https://<your-ui>.vercel.app   │  ──────>  │  https://<your-api>.onrender.com  │
│  • Angular 22 Single-Page App   │   HTTPS   │  • Node.js / Express Web Service  │
│  • Signals & RxJS Engine        │   REST    │  • Telemetry Simulation Engine    │
│  • Circular Gauges & Chart.js   │   & SSE   │  • 1-Second SSE Streaming         │
│  • Browser Blob CSV / Excel     │           │  • In-Memory 100-Sample History   │
└─────────────────────────────────┘           └───────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Windows Electron Desktop Application                  │
│  • Electron Main / Preload Bridge (`window.telemetryDesktop`)                    │
│  • Spawns Local Express Backend bound to `127.0.0.1:<random-port>`               │
│  • Native OS Save Dialog for CSV and Excel exports                              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

- **Node.js**: `v20.x` or `v24.x` (LTS recommended)
- **npm**: `v10.x` or higher (workspaces support required)
- **GitHub Repository**: Accessible repository with `main` branch
- **Render Account**: [https://render.com](https://render.com) (Free or Team plan)
- **Vercel Account**: [https://vercel.com](https://vercel.com) (Hobby or Pro plan)

---

## 🛠️ Step 1: Push Code to GitHub

Ensure all workspace code and monorepo files are committed and pushed:

```bash
git add .
git commit -m "feat: complete Vercel and Render deployment configuration"
git push origin main
```

---

## 🚀 Step 2: Deploy Backend to Render

Deploy the backend first so you have your production API URL ready before configuring the frontend.

### 1. Create Web Service
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **"New +"** → **"Web Service"**.
3. Connect your GitHub repository.

### 2. Configure Service Settings
| Setting | Recommended Value | Notes |
| :--- | :--- | :--- |
| **Name** | `controller-monitor-api` | Or any preferred unique name |
| **Region** | Choose closest to your users | E.g., Singapore, Frankfurt, Oregon |
| **Branch** | `main` | Production branch |
| **Root Directory** | *Leave completely empty* | **CRITICAL**: Do NOT enter `backend/api` because the backend imports `@telemetry-contracts` from the repository root workspace. |
| **Runtime** | `Node` | Standard Node.js environment |
| **Build Command** | `npm install --include=dev && npm run build:api` | Installs monorepo dependencies and compiles contracts + backend |
| **Start Command** | `npm run start:backend` | Starts compiled JavaScript server (`node backend/api/dist/server.js`) |
| **Instance Type** | `Free` (or higher) | Free tier spins down after 15 min of inactivity |

### 3. Configure Environment Variables
In the Render service **Environment Variables** tab, define:

| Key | Value | Purpose |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations and binds to `0.0.0.0` |
| `RENDER` | `true` | Identifies Render cloud environment |
| `CORS_ALLOWED_ORIGINS` | `*` *(or your Vercel URL once known)* | Allows cross-origin requests from Vercel |
| `TELEMETRY_INTERVAL_MS` | `1000` | 1-second cadence for telemetry simulation |
| `TELEMETRY_HISTORY_CAPACITY` | `100` | Rolling historical sample capacity |

> ℹ️ *Note: Render automatically injects `PORT` (usually `10000`). The backend dynamically binds to `process.env.PORT` on `0.0.0.0`.*

### 4. Configure Health Check Path
- Under **Health Check Path**, enter: `/health`
- The backend returns `{ "status": "ok", "service": "controller-monitor-api" }` within < 5ms without triggering simulation ticks.

### 5. Verify Backend Deployment
Once Render marks the service **Live**, copy your service URL:
```
https://<your-render-service>.onrender.com
```

Test the endpoints in your terminal or browser:
```bash
# 1. Health check
curl -i https://<your-render-service>.onrender.com/health

# 2. REST Dashboard snapshot
curl -i https://<your-render-service>.onrender.com/api/dashboard

# 3. Real-time SSE Stream
curl -N https://<your-render-service>.onrender.com/api/telemetry/stream
```

---

## 🌐 Step 3: Deploy Frontend to Vercel

### 1. Import Project to Vercel
1. Log in to [Vercel Dashboard](https://vercel.com).
2. Click **"Add New..."** → **"Project"** → **Import** your repository.

### 2. Configure Vercel Project Settings
| Setting | Value | Notes |
| :--- | :--- | :--- |
| **Framework Preset** | `Angular` (or `Other`) | Vercel will detect root configuration |
| **Root Directory** | `./` | Root of monorepo so workspace packages resolve |
| **Build Command** | `npm run build:web` | Compiles contracts and Angular frontend |
| **Output Directory** | `frontend/desktop-ui/dist/desktop-ui/browser` | Location of Angular static assets |
| **Install Command** | `npm install` | Installs root dependencies |

### 3. Update Vercel API Rewrites
In [vercel.json](../vercel.json), ensure the rewrite destination points to your Render backend URL:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "version": 2,
  "buildCommand": "npm run build:vercel",
  "outputDirectory": "frontend/desktop-ui/dist/desktop-ui/browser",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://<your-render-service>.onrender.com/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Commit and push any updates to trigger an automatic redeployment on Vercel:
```bash
git add vercel.json
git commit -m "chore: point vercel /api rewrites to render backend"
git push origin main
```

---

## 🧪 Step 4: End-to-End Validation

Open the deployed Vercel URL in your browser:

1. **Connection Status**:
   - Verify the top navigation bar displays a green **"Connected"** badge.
2. **Real-Time Telemetry Updates**:
   - Velocity, pressure, and temperature gauges and value cards update dynamically every ~1 second.
3. **Chart.js Graphs**:
   - Rolling charts plot continuous live data. Test zoom (wheel) and pan (drag).
4. **Unit Conversion**:
   - Change units (e.g. `cm/s` to `m/s`, `mbar` to `bar` or `psi`, `°C` to `°F` or `K`). All gauges and graphs convert seamlessly.
5. **Theme Switching**:
   - Toggle between Light and Dark mode using the theme button.
6. **Browser Data Export**:
   - Click **"Export CSV"**: A valid `.csv` file downloads with timestamps and selected units.
   - Click **"Export Excel"**: A styled `.xlsx` workbook downloads and opens cleanly in Microsoft Excel.

---

## ⚠️ Known Limitations & Behaviors

1. **Render Free Tier Cold Starts**:
   - Free instances on Render spin down after 15 minutes without inbound HTTP requests.
   - When visiting the Vercel site after inactivity, the first request may take 30–50 seconds while Render spins up the container.
   - The Angular application displays a **"Connecting..."** or **"Reconnecting..."** state during cold starts and resumes real-time SSE streaming automatically once the backend is ready.
2. **In-Memory Simulation State**:
   - The telemetry engine maintains the rolling 100-sample history in memory. If Render restarts the service, the simulation history resets to the canonical baseline.
3. **Desktop Application Preservation**:
   - The desktop Electron build (`npm run package:win`) continues to operate independently by launching its own local Express server on `127.0.0.1` and using native OS file dialogs for export.

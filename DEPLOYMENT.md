# Deployment Guide: Vercel (Frontend) & Render (Backend)

This guide walks you through deploying the **Telemetry Controller Monitoring Dashboard** across two cloud platforms:
- **Backend**: Express telemetry simulation engine hosted as a Web Service on **Render** (provides continuous SSE streaming).
- **Frontend**: Angular 22 Single Page Application (SPA) deployed to **Vercel** with automatic client routing.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────┐           ┌───────────────────────────────────┐
│         Vercel (Frontend)       │           │          Render (Backend)         │
│  https://<your-ui>.vercel.app   │  ──────>  │  https://<your-api>.onrender.com  │
│  • Angular 22 Single-Page App   │   REST    │  • Node.js / Express Web Service  │
│  • Circular Gauges & Charts     │   & SSE   │  • Telemetry Simulation Engine    │
│  • CSV / Excel Exporter         │           │  • Continuous Server-Sent Events  │
└─────────────────────────────────┘           └───────────────────────────────────┘
```

---

## 🛠️ Step 1: Push Code to GitHub

Ensure all workspace code and recent configuration updates are pushed to your GitHub repository:

```bash
git add .
git commit -m "feat: configure Vercel frontend and Render backend deployment"
git push origin main
```

---

## 🚀 Part 1: Deploy Backend to Render

Deploy the backend first so you have your live Render backend URL ready.

### 1. Create a Web Service on Render
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **"New +"** → **"Web Service"**.
3. Connect your GitHub repository.

### 2. Configure Service Settings
Fill in the deployment settings:
- **Name**: `telemetry-backend` (or any custom name)
- **Region**: Choose the closest region to your users
- **Branch**: `main`
- **Root Directory**: **Leave completely empty** (do NOT put `backend/api` here, because this is an npm monorepo with shared packages!).
- **Runtime**: `Node`
- **Build Command** (put in the "Build Command" field only):
  ```bash
  npm install --include=dev && npm run build:api
  ```
- **Start Command** (put in the "Start Command" field only):
  ```bash
  npm run start:backend
  ```
- **Instance Type**: `Free` (or higher)

### 3. Configure Environment Variables
Under the **Environment Variables** section on Render, add:
| Variable | Value | Notes |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production mode |
| `PORT` | `10000` | Render injects `PORT` automatically, but `10000` is default |
| `HOST` | `0.0.0.0` | Allows public cloud routing on Render |
| `CORS_ALLOWED_ORIGINS` | `*` | Or specify your Vercel URL once known (e.g. `https://<your-project>.vercel.app`) |
| `TELEMETRY_INTERVAL_MS` | `1000` | Simulation tick interval in milliseconds |
| `TELEMETRY_HISTORY_CAPACITY` | `100` | Telemetry trend history buffer size |

### 4. Deploy and Verify Backend
1. Click **"Create Web Service"**.
2. Wait for the build and deployment logs to finish.
3. Once live, Render will provide a service URL:
   ```
   https://<your-api-name>.onrender.com
   ```
4. Verify health by opening in your browser:
   ```
   https://<your-api-name>.onrender.com/api/health
   ```
   *You should receive `{ status: "ok", uptime: ..., simulation: { running: true } }`.*

---

## 🌐 Part 2: Deploy Frontend to Vercel

### Option A: Connect Vercel to your Live Render Backend (Recommended for separate hosting)

To route `/api` calls from the Vercel frontend directly to your Render backend:

1. Update [vercel.json](./vercel.json) to proxy `/api/*` to your Render backend URL:
   ```json
   {
     "$schema": "https://openapi.vercel.sh/vercel.json",
     "version": 2,
     "buildCommand": "npm run build:web",
     "outputDirectory": "frontend/desktop-ui/dist/desktop-ui/browser",
     "rewrites": [
       {
         "source": "/api/(.*)",
         "destination": "https://<your-api-name>.onrender.com/api/$1"
       },
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```
   *(Replace `<your-api-name>.onrender.com` with your actual Render service domain.)*
   
2. Commit and push:
   ```bash
   git add vercel.json
   git commit -m "chore: point vercel /api rewrites to render backend"
   git push origin main
   ```

3. Import the repository into [Vercel](https://vercel.com):
   - Click **"Add New..."** → **"Project"** → **Import** your GitHub repository.

   #### Configuration Settings on Vercel:

   | Vercel Setting | If Root Directory is `./` (Recommended) | If Root Directory is `frontend/desktop-ui` |
   | :--- | :--- | :--- |
   | **Framework Preset** | `Other` (or Angular) | `Angular` |
   | **Root Directory** | `./` | `frontend/desktop-ui` |
   | **Build Command** | `npm run build:web` | `npm run build` |
   | **Output Directory** | `frontend/desktop-ui/dist/desktop-ui/browser` | `dist/desktop-ui/browser` |

> 💡 **Why `[STATIC_BUILD_NO_OUT_DIR] No Output Directory named "browser" found` happened**:
> Angular application builds generate artifacts in `dist/desktop-ui/browser`.
> When Vercel uses the default Angular preset, it looks for just `browser` instead of `dist/desktop-ui/browser`.
> We have added a dedicated [`frontend/desktop-ui/vercel.json`](./frontend/desktop-ui/vercel.json) as well as the root [`vercel.json`](./vercel.json) to explicitly tell Vercel to look inside `dist/desktop-ui/browser` in either setup!

---

### Option B: All-in-One Vercel Single-Link Deployment (Alternative)

If you also wish to maintain an all-in-one standalone serverless copy on Vercel:
- **Build Command**: `npm run build:vercel`
- **Output Directory**: `frontend/desktop-ui/dist/desktop-ui/browser`
- Rewrites map `/api/(.*)` to the serverless function `/api` defined in `api/index.js`.

---

## 🧪 Validating the Live Deployment

Once both are deployed, open your Vercel URL in your browser:
1. **Header Indicator**: Verify the connection status shows **"Connected"** (green badge).
2. **Real-time Gauges & Charts**: Verify velocity, pressure, and temperature update dynamically.
3. **Data Export**: Click **Export CSV** or **Export Excel** in the header and verify that the file downloads properly.
4. **Backend Health**: Visit `https://<your-api-name>.onrender.com/api/health` directly.

---

## 💡 Troubleshooting & Notes

- **Cold Starts on Render Free Tier**:
  - The Render free tier spins down after 15 minutes of inactivity. When you first open the Vercel dashboard, the initial request might take 30–50 seconds to wake up the Render service. Once awake, updates flow at 1-second intervals.
- **CORS Configuration**:
  - If CORS blocks any request, verify on Render that `CORS_ALLOWED_ORIGINS` includes your Vercel domain or is set to `*`.
- **Content Security Policy**:
  - The frontend `index.html` has been configured with `connect-src https: http: wss: ws:` to permit secure remote API and SSE stream connections.

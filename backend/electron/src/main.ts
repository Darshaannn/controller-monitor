import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import fs from "fs/promises";
import { startServer, ServerInstance } from "telemetry-api";

let mainWindow: BrowserWindow | null = null;
let serverInstance: ServerInstance | null = null;

async function bootstrapBackend(): Promise<string> {
  if (serverInstance) {
    return serverInstance.url;
  }
  // Bind dynamically to loopback 127.0.0.1 on an available OS port
  serverInstance = await startServer(0, "127.0.0.1");
  console.log(`Backend initialized at: ${serverInstance.url}`);
  return serverInstance.url;
}

async function createWindow() {
  const apiUrl = await bootstrapBackend();

  mainWindow = new BrowserWindow({
    title: "Telemetry Monitoring Dashboard",
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: "#0f172a",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });

  // Prevent navigation outside of the application dashboard
  mainWindow.webContents.on("will-navigate", (event, navigationUrl) => {
    const parsed = new URL(navigationUrl);
    // Allow local origins (file://, localhost, 127.0.0.1)
    if (
      parsed.protocol !== "file:" &&
      parsed.hostname !== "localhost" &&
      parsed.hostname !== "127.0.0.1"
    ) {
      event.preventDefault();
      console.warn(
        `Blocked unauthorized navigation attempt to: ${navigationUrl}`,
      );
    }
  });

  // Deny creation of auxiliary windows or popups
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: "deny" };
  });

  // Secure CSP
  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": [
            "default-src 'self' 'unsafe-inline' http://127.0.0.1:* ws://127.0.0.1:* data: blob:;",
          ],
        },
      });
    },
  );

  const devServerUrl = process.env["ELECTRON_START_URL"];
  if (devServerUrl) {
    await mainWindow.loadURL(devServerUrl);
  } else {
    // Production packaged build
    const indexPath = path.join(
      __dirname,
      "../../../frontend/desktop-ui/dist/desktop-ui/browser/index.html",
    );
    await mainWindow.loadFile(indexPath).catch(async () => {
      // Fallback for dev without ELECTRON_START_URL
      await mainWindow?.loadURL("http://localhost:4200");
    });
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle("telemetry:get-api-endpoint", () => {
  return serverInstance ? serverInstance.url : "http://127.0.0.1:3000";
});

ipcMain.handle("telemetry:get-app-version", () => {
  return app.getVersion();
});

ipcMain.handle("telemetry:show-save-dialog", async (_event, options) => {
  if (!mainWindow) return null;
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result.canceled ? null : result.filePath;
});

ipcMain.handle("telemetry:save-file", async (_event, { filePath, content }) => {
  try {
    if (!filePath || typeof filePath !== "string") {
      throw new Error("Invalid destination file path");
    }

    // Defense-in-depth: enforce allowed export extensions (.csv, .xlsx)
    const ext = path.extname(filePath).toLowerCase();
    if (ext !== ".csv" && ext !== ".xlsx") {
      throw new Error(`Unauthorized file extension: ${ext}`);
    }

    // Resolve normalized absolute path
    const resolvedPath = path.resolve(filePath);
    await fs.writeFile(resolvedPath, content);
    return true;
  } catch (err) {
    console.error("Error saving file:", err);
    return false;
  }
});

// App Lifecycle
app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  if (serverInstance) {
    console.log("Shutting down telemetry server and simulation engine...");
    serverInstance.simulatorService.stop();
    serverInstance.server.close();
    serverInstance = null;
  }
});

import { contextBridge, ipcRenderer } from "electron";
import { TelemetryDesktopApi } from "./interfaces";

export { TelemetryDesktopApi };

const api: TelemetryDesktopApi = {
  getApiEndpoint: () => ipcRenderer.invoke("telemetry:get-api-endpoint"),
  showSaveDialog: (options) =>
    ipcRenderer.invoke("telemetry:show-save-dialog", options),
  saveFile: (filePath, content) =>
    ipcRenderer.invoke("telemetry:save-file", { filePath, content }),
  getAppVersion: () => ipcRenderer.invoke("telemetry:get-app-version"),
};

contextBridge.exposeInMainWorld("telemetryDesktop", api);

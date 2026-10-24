export interface TelemetryDesktopApi {
  getApiEndpoint: () => Promise<string>;
  showSaveDialog: (options: {
    defaultPath?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }) => Promise<string | null>;
  saveFile: (
    filePath: string,
    content: string | Uint8Array,
  ) => Promise<boolean>;
  getAppVersion: () => Promise<string>;
}

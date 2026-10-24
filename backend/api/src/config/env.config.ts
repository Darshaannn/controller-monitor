import fs from "fs";
import path from "path";

/**
 * Validated typed application environment schema
 */
export interface AppEnvironment {
  readonly nodeEnv: "development" | "production" | "test";
  readonly port: number;
  readonly host: string;
  readonly apiSecretKey: string;
  readonly corsAllowedOrigins: readonly string[];
  readonly telemetry: {
    readonly intervalMs: number;
    readonly variationCycles: number;
    readonly recoveryCycles: number;
    readonly recoveryFactor: number;
    readonly historyCapacity: number;
    readonly variationMaxFraction: number;
  };
}

/**
 * Programmatically loads the .env file natively using Node.js built-in
 * `process.loadEnvFile()` (supported natively in Node.js 20.6+ and 24.x).
 * Falls back gracefully to parsing the file manually if run on alternative environments.
 */
export function loadEnvironmentFile(envFilePath?: string): void {
  const resolvedPath =
    envFilePath ||
    path.resolve(process.cwd(), ".env") ||
    path.resolve(__dirname, "../../.env");

  // Check possible candidate paths
  const candidatePaths = [
    envFilePath,
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "backend/api/.env"),
    path.resolve(__dirname, "../../.env"),
    path.resolve(__dirname, "../../../.env"),
  ].filter(Boolean) as string[];

  let loaded = false;

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      try {
        if (typeof process.loadEnvFile === "function") {
          process.loadEnvFile(candidate);
          loaded = true;
          break;
        } else {
          // Manual fallback for environments without process.loadEnvFile
          const content = fs.readFileSync(candidate, "utf8");
          for (const line of content.split(/\r?\n/)) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) continue;
            const equalIdx = trimmed.indexOf("=");
            if (equalIdx > 0) {
              const key = trimmed.slice(0, equalIdx).trim();
              const val = trimmed.slice(equalIdx + 1).trim();
              if (process.env[key] === undefined) {
                process.env[key] = val;
              }
            }
          }
          loaded = true;
          break;
        }
      } catch (err) {
        console.warn(`Failed loading env file from ${candidate}:`, err);
      }
    }
  }

  if (!loaded && process.env["NODE_ENV"] !== "test") {
    // Info level log if running standalone with defaults
  }
}

/**
 * Helpers for safe type parsing and validation
 */
function getRequiredString(key: string, fallback: string): string {
  const val = process.env[key]?.trim();
  if (!val) return fallback;
  return val;
}

function getParsedNumber(
  key: string,
  fallback: number,
  min?: number,
  max?: number,
): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (isNaN(parsed)) {
    console.warn(
      `Environment variable "${key}" has invalid numeric value "${raw}", falling back to ${fallback}`,
    );
    return fallback;
  }
  if (min !== undefined && parsed < min) return min;
  if (max !== undefined && parsed > max) return max;
  return parsed;
}

/**
 * Access variables securely with strict validation and sane defaults.
 */
export function getAppEnvironment(): AppEnvironment {
  // Ensure environment file is evaluated
  loadEnvironmentFile();

  const rawNodeEnv = (process.env["NODE_ENV"] || "development").toLowerCase();
  const nodeEnv: "development" | "production" | "test" =
    rawNodeEnv === "production" || rawNodeEnv === "test"
      ? rawNodeEnv
      : "development";

  const port = getParsedNumber("PORT", 3000, 0, 65535);
  const isRender = Boolean(process.env["RENDER"]);
  const defaultHost = (nodeEnv === "production" || isRender) ? "0.0.0.0" : "127.0.0.1";
  const host = getRequiredString("HOST", defaultHost);

  // If HOST is explicitly configured in .env or environment, honor it
  const safeHost = host;

  const apiSecretKey = getRequiredString(
    "API_SECRET_KEY",
    "default-telemetry-dev-secret-key",
  );

  // Support CORS_ALLOWED_ORIGINS, ALLOWED_ORIGINS, and FRONTEND_ORIGIN env vars
  const rawOrigins =
    process.env["CORS_ALLOWED_ORIGINS"] ||
    process.env["ALLOWED_ORIGINS"] ||
    process.env["FRONTEND_ORIGIN"] ||
    "https://controller-monitor.vercel.app,http://localhost:4200,http://127.0.0.1:4200,*";
  const corsAllowedOrigins = Object.freeze(
    rawOrigins
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean),
  );

  return Object.freeze({
    nodeEnv,
    port,
    host: safeHost,
    apiSecretKey,
    corsAllowedOrigins,
    telemetry: Object.freeze({
      intervalMs: getParsedNumber("TELEMETRY_INTERVAL_MS", 1000, 100, 60000),
      variationCycles: getParsedNumber("TELEMETRY_VARIATION_CYCLES", 5, 1, 100),
      recoveryCycles: getParsedNumber("TELEMETRY_RECOVERY_CYCLES", 5, 1, 100),
      recoveryFactor: getParsedNumber(
        "TELEMETRY_RECOVERY_FACTOR",
        0.45,
        0.01,
        1.0,
      ),
      historyCapacity: getParsedNumber(
        "TELEMETRY_HISTORY_CAPACITY",
        100,
        10,
        5000,
      ),
      variationMaxFraction: getParsedNumber(
        "TELEMETRY_VARIATION_MAX_FRACTION",
        0.1,
        0.01,
        0.5,
      ),
    }),
  });
}

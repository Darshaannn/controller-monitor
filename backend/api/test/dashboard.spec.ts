import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { TelemetryStateService } from "../src/services/telemetry-state.service";
import { TelemetrySimulatorService } from "../src/services/telemetry-simulator.service";
import {
  DEFAULT_TELEMETRY_CONFIG,
  TelemetryConfig,
} from "../src/config/telemetry.config";
import { CANONICAL_BASELINES } from "telemetry-contracts";

describe("10.1 Telemetry Initialization", () => {
  it("initializes canonical baseline values correctly", () => {
    const state = new TelemetryStateService(
      DEFAULT_TELEMETRY_CONFIG,
      new Date("2026-10-16T12:00:00Z"),
    );
    const reading = state.getCurrentReading();

    expect(reading.velocity).toBe(185.4);
    expect(reading.pressure).toBe(1012);
    expect(reading.temperature).toBe(36.8);

    const snapshot = state.getSnapshot();
    expect(snapshot.velocity.unit).toBe("cm/s");
    expect(snapshot.pressure.unit).toBe("mbar");
    expect(snapshot.temperature.unit).toBe("°C");
    expect(snapshot.velocity.history.length).toBe(1);
    expect(snapshot.velocity.history[0].time).toBe("12:00:00");
    expect(snapshot.timestamp).toBe("2026-10-16T12:00:00.000Z");
  });
});

describe("10.2 Telemetry Simulation Engine", () => {
  let config: TelemetryConfig;

  beforeEach(() => {
    config = { ...DEFAULT_TELEMETRY_CONFIG };
  });

  it("generates deterministic bounded positive and negative variations during variation phase", () => {
    const state = new TelemetryStateService(config);

    // Return fixed sequence of random numbers: first 3 calls (0.0 => -10%), next 3 calls (1.0 => +10%)
    let callCount = 0;
    const deterministicRandom = () => {
      callCount++;
      return callCount <= 3 ? 0.0 : 1.0;
    };

    const simulator = new TelemetrySimulatorService(
      config,
      state,
      deterministicRandom,
    );

    // Tick 1: random = 0.0 -> (0*2 - 1)*0.10 = -0.10 (-10%)
    const reading1 = simulator.tick();
    expect(reading1.velocity).toBeCloseTo(185.4 * 0.9, 1);
    expect(reading1.pressure).toBeCloseTo(1012 * 0.9, 1);
    expect(reading1.temperature).toBeCloseTo(36.8 * 0.9, 1);
    expect(simulator.getPhase()).toBe("VARIATION");
    expect(simulator.getCycleCount()).toBe(1);

    // Tick 2: random = 1.0 -> (1*2 - 1)*0.10 = +0.10 (+10%)
    const reading2 = simulator.tick();
    expect(reading2.velocity).toBeCloseTo(reading1.velocity * 1.1, 1);
    expect(simulator.getPhase()).toBe("VARIATION");
    expect(simulator.getCycleCount()).toBe(2);
  });

  it("transitions from 5 variation cycles to recovery phase and moves toward baseline", () => {
    const state = new TelemetryStateService(config);
    // Fixed positive deviation: random = 1.0 => +10% per tick
    const positiveRandom = () => 1.0;
    const simulator = new TelemetrySimulatorService(
      config,
      state,
      positiveRandom,
    );

    // Execute 5 variation cycles
    for (let i = 1; i <= 5; i++) {
      simulator.tick();
      expect(simulator.getPhase()).toBe("VARIATION");
      expect(simulator.getCycleCount()).toBe(i);
    }

    const peakReading = state.getCurrentReading();
    expect(peakReading.velocity).toBeGreaterThan(
      CANONICAL_BASELINES.velocity.value,
    );

    // Tick 6: Must transition to RECOVERY and move closer to baseline
    simulator.tick();
    expect(simulator.getPhase()).toBe("RECOVERY");
    expect(simulator.getCycleCount()).toBe(1);

    const recoveryReading1 = state.getCurrentReading();
    const peakDev = Math.abs(
      peakReading.velocity - CANONICAL_BASELINES.velocity.value,
    );
    const recDev = Math.abs(
      recoveryReading1.velocity - CANONICAL_BASELINES.velocity.value,
    );
    expect(recDev).toBeLessThan(peakDev);

    // Progress through remaining recovery cycles (cycles 2, 3, 4, 5)
    for (let r = 2; r <= 5; r++) {
      simulator.tick();
      expect(simulator.getPhase()).toBe("RECOVERY");
      expect(simulator.getCycleCount()).toBe(r);
    }

    // Tick 11: Transitions back to VARIATION cycle 1
    simulator.tick();
    expect(simulator.getPhase()).toBe("VARIATION");
    expect(simulator.getCycleCount()).toBe(1);
  });

  it("guarantees no NaN or non-finite numbers", () => {
    const state = new TelemetryStateService(config);
    const simulator = new TelemetrySimulatorService(config, state);

    for (let i = 0; i < 50; i++) {
      const r = simulator.tick();
      expect(Number.isFinite(r.velocity)).toBe(true);
      expect(Number.isFinite(r.pressure)).toBe(true);
      expect(Number.isFinite(r.temperature)).toBe(true);
      expect(r.velocity).toBeGreaterThanOrEqual(0);
      expect(r.pressure).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("10.3 Rolling History Limit & Immutability", () => {
  it("strictly caps rolling history at 100 samples and removes oldest chronologically", () => {
    const state = new TelemetryStateService(DEFAULT_TELEMETRY_CONFIG);
    const simulator = new TelemetrySimulatorService(
      DEFAULT_TELEMETRY_CONFIG,
      state,
    );

    // Initial state has 1 sample
    expect(state.getHistoryLengths().velocity).toBe(1);

    // Simulate 120 ticks
    for (let i = 0; i < 120; i++) {
      simulator.tick();
    }

    const snapshot = state.getSnapshot();
    expect(snapshot.velocity.history.length).toBe(100);
    expect(snapshot.pressure.history.length).toBe(100);
    expect(snapshot.temperature.history.length).toBe(100);

    // Verify chronological ordering
    for (let i = 1; i < snapshot.velocity.history.length; i++) {
      const prev = snapshot.velocity.history[i - 1];
      const curr = snapshot.velocity.history[i];
      if (prev.timestamp && curr.timestamp) {
        expect(new Date(curr.timestamp).getTime()).toBeGreaterThanOrEqual(
          new Date(prev.timestamp).getTime(),
        );
      }
    }
  });

  it("returns immutable snapshots that cannot mutate internal state", () => {
    const state = new TelemetryStateService(DEFAULT_TELEMETRY_CONFIG);
    const snapshot = state.getSnapshot();

    // Mutate the returned array
    (snapshot.velocity.history as unknown as Array<unknown>).pop();

    // State history length should remain unaffected
    expect(state.getHistoryLengths().velocity).toBe(1);
  });
});

describe("10.4 REST API Integration & Independence", () => {
  it("returns HTTP 200 with contract-compatible payload", async () => {
    const { app } = createApp();
    const res = await request(app).get("/api/dashboard");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("timestamp");
    expect(res.body).toHaveProperty("velocity");
    expect(res.body).toHaveProperty("pressure");
    expect(res.body).toHaveProperty("temperature");
    expect(res.body.velocity.value).toBe(185.4);
    expect(res.body.velocity.unit).toBe("cm/s");
    expect(Array.isArray(res.body.velocity.history)).toBe(true);
  });

  it("repeated GET requests between ticks do NOT advance simulation or create extra samples", async () => {
    const { app, stateService } = createApp();

    // Call 5 times consecutively
    for (let i = 0; i < 5; i++) {
      await request(app).get("/api/dashboard");
    }

    expect(stateService.getHistoryLengths().velocity).toBe(1);
  });

  it("reflects updated readings after a simulation tick occurs", async () => {
    const { app, simulatorService } = createApp();

    const initialRes = await request(app).get("/api/dashboard");
    expect(initialRes.body.velocity.history.length).toBe(1);

    // Trigger one tick
    simulatorService.tick();

    const updatedRes = await request(app).get("/api/dashboard");
    expect(updatedRes.body.velocity.history.length).toBe(2);
  });

  it("streams real-time telemetry events via Server-Sent Events (SSE) at /api/telemetry/stream", async () => {
    const { app } = createApp();

    const res = await request(app)
      .get("/api/telemetry/stream")
      .buffer(true)
      .parse((res, callback) => {
        let rawData = "";
        res.on("data", (chunk: Buffer) => {
          rawData += chunk.toString("utf8");
          // Abort after receiving initial snapshot event
          if (rawData.includes("event: snapshot")) {
            res.destroy();
            callback(null, rawData);
          }
        });
      });

    expect(res.headers["content-type"]).toContain("text/event-stream");
    expect(res.headers["cache-control"]).toContain("no-cache");
    expect(res.body).toContain("event: snapshot");
    expect(res.body).toContain("data: {");
  });

  it("cleans up SSE listeners on stateService when client closes the connection", async () => {
    const { app, stateService } = createApp();

    const initialListeners = stateService.listenerCount("snapshot");

    await new Promise<void>((resolve) => {
      const req = request(app).get("/api/telemetry/stream").buffer(false);

      req.on("response", (res) => {
        // Active connection added a listener
        expect(stateService.listenerCount("snapshot")).toBe(
          initialListeners + 1,
        );

        // Abort/close client connection
        res.destroy();

        // Give event loop tick for 'close' event handler to execute
        setTimeout(() => {
          expect(stateService.listenerCount("snapshot")).toBe(initialListeners);
          resolve();
        }, 50);
      });

      req.end();
    });
  });

  it("handles controller snapshot generation failure gracefully with HTTP 500", async () => {
    const { app, stateService } = createApp();
    vi.spyOn(stateService, "getSnapshot").mockImplementationOnce(() => {
      throw new Error("Simulated memory corrupted snapshot error");
    });

    const res = await request(app).get("/api/dashboard");
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toBe("Failed to retrieve telemetry snapshot");
  });

  it("responds to /health with fast lightweight status suitable for cloud probes", async () => {
    const { app } = createApp();
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: "ok",
      service: "controller-monitor-api",
    });
  });

  it("responds to /api/health with detailed service uptime and simulation status", async () => {
    const { app } = createApp();
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("controller-monitor-api");
    expect(typeof res.body.uptime).toBe("number");
    expect(res.body.simulation).toBeDefined();
  });

  it("handles CORS requests correctly for allowed and rejected origins", async () => {
    const { app } = createApp();

    // Allowed origin (or local dev origin)
    const allowedRes = await request(app)
      .get("/health")
      .set("Origin", "http://localhost:4200");
    expect(allowedRes.headers["access-control-allow-origin"]).toBe("http://localhost:4200");

    // Options preflight check
    const optionsRes = await request(app)
      .options("/api/dashboard")
      .set("Origin", "http://localhost:4200");
    expect(optionsRes.status).toBe(204);
    expect(optionsRes.headers["access-control-allow-origin"]).toBe("http://localhost:4200");
  });
});

describe("10.5 Lifecycle & Timer Management", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts cleanly, advances on 1,000ms intervals, and stops timer without leaks", () => {
    const state = new TelemetryStateService(DEFAULT_TELEMETRY_CONFIG);
    const simulator = new TelemetrySimulatorService(
      DEFAULT_TELEMETRY_CONFIG,
      state,
    );

    expect(simulator.getIsRunning()).toBe(false);

    simulator.start();
    expect(simulator.getIsRunning()).toBe(true);

    // Starting again is idempotent
    simulator.start();
    expect(simulator.getIsRunning()).toBe(true);

    // Advance fake timer by 3,000ms (3 ticks)
    vi.advanceTimersByTime(3000);
    expect(state.getHistoryLengths().velocity).toBe(4); // 1 initial + 3 ticks

    simulator.stop();
    expect(simulator.getIsRunning()).toBe(false);

    // Advance time further: no new samples should be generated
    vi.advanceTimersByTime(5000);
    expect(state.getHistoryLengths().velocity).toBe(4);
  });
});

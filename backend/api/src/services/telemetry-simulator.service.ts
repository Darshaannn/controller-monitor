import { TelemetryConfig } from "../interfaces";
import {
  TelemetryReading,
  TelemetryStateService,
} from "./telemetry-state.service";
import { SimulationPhase, RandomSource, ClockSource } from "../types";

export { SimulationPhase, RandomSource, ClockSource };

export class TelemetrySimulatorService {
  private phase: SimulationPhase = "VARIATION";
  private cycleCount: number = 0;
  private timer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(
    private readonly config: TelemetryConfig,
    private readonly stateService: TelemetryStateService,
    private readonly randomSource: RandomSource = Math.random,
    private readonly clockSource: ClockSource = () => new Date(),
  ) {}

  start(): void {
    if (this.isRunning) {
      return; // Idempotent start: prevent multiple intervals
    }
    this.isRunning = true;
    this.timer = setInterval(() => {
      this.tick();
    }, this.config.intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }

  getPhase(): SimulationPhase {
    return this.phase;
  }

  getCycleCount(): number {
    return this.cycleCount;
  }

  /**
   * Advances simulation by exactly one update cycle.
   * Can be invoked directly in deterministic tests without timers.
   */
  tick(): TelemetryReading {
    this.cycleCount++;

    if (this.phase === "VARIATION") {
      if (this.cycleCount > this.config.variationCycles) {
        // Transition to Recovery phase
        this.phase = "RECOVERY";
        this.cycleCount = 1;
      }
    } else {
      if (this.cycleCount > this.config.recoveryCycles) {
        // Transition back to Variation phase
        this.phase = "VARIATION";
        this.cycleCount = 1;
      }
    }

    const current = this.stateService.getCurrentReading();
    const timestamp = this.clockSource();

    let newVelocity: number;
    let newPressure: number;
    let newTemperature: number;

    if (this.phase === "VARIATION") {
      newVelocity = this.calculateVariation(
        current.velocity,
        this.config.baselines.velocity.min,
        this.config.baselines.velocity.max,
      );
      newPressure = this.calculateVariation(
        current.pressure,
        this.config.baselines.pressure.min,
        this.config.baselines.pressure.max,
      );
      newTemperature = this.calculateVariation(
        current.temperature,
        this.config.baselines.temperature.min,
        this.config.baselines.temperature.max,
      );
    } else {
      newVelocity = this.calculateRecovery(
        current.velocity,
        this.config.baselines.velocity.value,
        this.config.baselines.velocity.min,
        this.config.baselines.velocity.max,
      );
      newPressure = this.calculateRecovery(
        current.pressure,
        this.config.baselines.pressure.value,
        this.config.baselines.pressure.min,
        this.config.baselines.pressure.max,
      );
      newTemperature = this.calculateRecovery(
        current.temperature,
        this.config.baselines.temperature.value,
        this.config.baselines.temperature.min,
        this.config.baselines.temperature.max,
      );
    }

    // Safety checks against non-finite values
    newVelocity = Number.isFinite(newVelocity)
      ? newVelocity
      : this.config.baselines.velocity.value;
    newPressure = Number.isFinite(newPressure)
      ? newPressure
      : this.config.baselines.pressure.value;
    newTemperature = Number.isFinite(newTemperature)
      ? newTemperature
      : this.config.baselines.temperature.value;

    // Presentation rounding to clean decimal precision while keeping full float safety
    newVelocity = Math.round(newVelocity * 10) / 10;
    newPressure = Math.round(newPressure * 10) / 10;
    newTemperature = Math.round(newTemperature * 10) / 10;

    const newReading: TelemetryReading = {
      timestamp,
      velocity: newVelocity,
      pressure: newPressure,
      temperature: newTemperature,
    };

    this.stateService.appendReading(newReading);
    return newReading;
  }

  /**
   * Phase A: Random variation within [-variationMaxFraction, +variationMaxFraction] of currentValue
   */
  private calculateVariation(
    currentValue: number,
    min: number,
    max: number,
  ): number {
    // Generate randomFactor in [-variationMaxFraction, +variationMaxFraction]
    const randomFraction =
      (this.randomSource() * 2 - 1) * this.config.variationMaxFraction;
    const delta = currentValue * randomFraction;
    const calculated = currentValue + delta;
    return Math.max(min, Math.min(max, calculated));
  }

  /**
   * Phase B: Progressive recovery towards baseline value
   * nextValue = currentValue + (baseline - currentValue) * recoveryFactor
   */
  private calculateRecovery(
    currentValue: number,
    baseline: number,
    min: number,
    max: number,
  ): number {
    const deltaToBaseline = baseline - currentValue;
    const step = deltaToBaseline * this.config.recoveryFactor;
    const calculated = currentValue + step;
    return Math.max(min, Math.min(max, calculated));
  }
}

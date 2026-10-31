import { TelemetryConfig } from "./telemetry-config";
import { TelemetryReading, TelemetryStateService } from "./telemetry-state.service";

export type SimulationPhase = "VARIATION" | "RECOVERY";
export type RandomSource = () => number;
export type ClockSource = () => Date;

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
      return;
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
   */
  tick(): TelemetryReading {
    this.cycleCount++;

    if (this.phase === "VARIATION") {
      if (this.cycleCount > this.config.variationCycles) {
        this.phase = "RECOVERY";
        this.cycleCount = 1;
      }
    } else {
      if (this.cycleCount > this.config.recoveryCycles) {
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

    const reading: TelemetryReading = {
      timestamp,
      velocity: Math.round(newVelocity * 10) / 10,
      pressure: Math.round(newPressure * 10) / 10,
      temperature: Math.round(newTemperature * 10) / 10,
    };

    this.stateService.appendReading(reading);
    return reading;
  }

  private calculateVariation(current: number, min: number, max: number): number {
    const fraction = (this.randomSource() * 2 - 1) * this.config.variationMaxFraction;
    const delta = current * fraction;
    return this.clamp(current + delta, min, max);
  }

  private calculateRecovery(
    current: number,
    baseline: number,
    min: number,
    max: number,
  ): number {
    const delta = (baseline - current) * this.config.recoveryFactor;
    return this.clamp(current + delta, min, max);
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}

import { EventEmitter } from "events";
import {
  DashboardResponse,
  TelemetryHistoryPoint,
  VelocityUnit,
  PressureUnit,
  TemperatureUnit,
} from "telemetry-contracts";
import { TelemetryConfig, TelemetryReading } from "../interfaces";

export { TelemetryReading };

export class TelemetryStateService extends EventEmitter {
  private currentReading: TelemetryReading;
  private readonly velocityHistory: TelemetryHistoryPoint[] = [];
  private readonly pressureHistory: TelemetryHistoryPoint[] = [];
  private readonly temperatureHistory: TelemetryHistoryPoint[] = [];

  constructor(
    private readonly config: TelemetryConfig,
    initialDate: Date = new Date(),
  ) {
    super();
    this.currentReading = {
      timestamp: initialDate,
      velocity: config.baselines.velocity.value,
      pressure: config.baselines.pressure.value,
      temperature: config.baselines.temperature.value,
    };

    // Initialize with first baseline sample
    this.appendReading(this.currentReading);
  }

  getCurrentReading(): TelemetryReading {
    return this.currentReading;
  }

  appendReading(reading: TelemetryReading): void {
    this.currentReading = reading;
    const timeStr = this.formatTime(reading.timestamp);
    const isoStr = reading.timestamp.toISOString();

    this.pushSample(this.velocityHistory, {
      time: timeStr,
      value: reading.velocity,
      timestamp: isoStr,
    });

    this.pushSample(this.pressureHistory, {
      time: timeStr,
      value: reading.pressure,
      timestamp: isoStr,
    });

    this.pushSample(this.temperatureHistory, {
      time: timeStr,
      value: reading.temperature,
      timestamp: isoStr,
    });

    // Notify all real-time SSE stream subscribers
    this.emit("snapshot", this.getSnapshot());
  }

  private pushSample(
    history: TelemetryHistoryPoint[],
    sample: TelemetryHistoryPoint,
  ): void {
    if (history.length >= this.config.historyCapacity) {
      history.shift(); // Evict oldest sample to maintain maximum capacity of 100
    }
    history.push(sample);
  }

  getSnapshot(): DashboardResponse {
    return {
      timestamp: this.currentReading.timestamp.toISOString(),
      velocity: {
        value: this.currentReading.velocity,
        unit: this.config.baselines.velocity.unit as VelocityUnit,
        history: [...this.velocityHistory], // Immutable copy to prevent external mutation
      },
      pressure: {
        value: this.currentReading.pressure,
        unit: this.config.baselines.pressure.unit as PressureUnit,
        history: [...this.pressureHistory], // Immutable copy
      },
      temperature: {
        value: this.currentReading.temperature,
        unit: this.config.baselines.temperature.unit as TemperatureUnit,
        history: [...this.temperatureHistory], // Immutable copy
      },
    };
  }

  getHistoryLengths(): {
    velocity: number;
    pressure: number;
    temperature: number;
  } {
    return {
      velocity: this.velocityHistory.length,
      pressure: this.pressureHistory.length,
      temperature: this.temperatureHistory.length,
    };
  }

  private formatTime(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
  }
}

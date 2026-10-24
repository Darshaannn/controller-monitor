import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { TelemetryApiService } from '../../../core/api/telemetry-api.service';
import {
  DashboardResponse,
  MetricKey,
  MeasurementUnit,
  VelocityUnit,
  PressureUnit,
  TemperatureUnit,
} from 'telemetry-contracts';
import { METRIC_DISPLAY_CONFIGS } from '../../../core/config/metric-display.config';
import { calculateMetricStatus } from '../../../core/utilities/metric-status.util';
import {
  convertVelocity,
  convertPressure,
  convertTemperature,
  convertMetricValue,
  SUPPORTED_UNITS,
} from '../../../core/utilities/unit-conversion.util';
import {
  TelemetryPanelViewModel,
  ConvertedHistoryPoint,
  ConnectionState,
} from '../../../core/models/dashboard-view.model';
import { TelemetrySessionService } from '../../../core/services/telemetry-session.service';
import { timer, Subscription } from 'rxjs';
import { exhaustMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DashboardFacadeService implements OnDestroy {
  private readonly api = inject(TelemetryApiService);
  private readonly sessionService = inject(TelemetrySessionService);
  private pollingSub: Subscription | null = null;
  private consecutiveFailures = 0;

  // Canonical raw snapshot received from backend
  readonly snapshot = signal<DashboardResponse | null>(null);
  readonly loading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly apiEndpoint = signal<string>('');
  readonly connectionState = signal<ConnectionState>('connecting');

  // User-selected display units state
  readonly selectedVelocityUnit = signal<VelocityUnit>('cm/s');
  readonly selectedPressureUnit = signal<PressureUnit>('mbar');
  readonly selectedTemperatureUnit = signal<TemperatureUnit>('°C');

  readonly lastUpdated = computed(() => {
    const s = this.snapshot();
    if (!s) return null;
    const date = new Date(s.timestamp);
    if (isNaN(date.getTime())) return s.timestamp;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  // Derived view models for each metric with on-the-fly local unit conversion
  readonly velocityModel = computed<TelemetryPanelViewModel | null>(() => {
    const s = this.snapshot();
    if (!s) return null;
    const cfg = METRIC_DISPLAY_CONFIGS.velocity;
    const metric = s.velocity;
    const targetUnit = this.selectedVelocityUnit();

    const displayVal = convertVelocity(metric.value, targetUnit);
    const convertedHistory: ConvertedHistoryPoint[] = metric.history.map((pt) => ({
      time: pt.time,
      value: Math.round(convertVelocity(pt.value, targetUnit) * 10) / 10,
      timestamp: pt.timestamp,
    }));

    return {
      key: 'velocity',
      label: cfg.label,
      canonicalValue: metric.value,
      canonicalUnit: metric.unit,
      displayValue: displayVal,
      displayUnit: targetUnit,
      supportedUnits: SUPPORTED_UNITS.velocity,
      baseline: Math.round(convertVelocity(cfg.baseline, targetUnit) * 10) / 10,
      gaugeMin: Math.round(convertVelocity(cfg.gaugeMin, targetUnit) * 10) / 10,
      gaugeMax: Math.round(convertVelocity(cfg.gaugeMax, targetUnit) * 10) / 10,
      status: calculateMetricStatus(metric.value, cfg.baseline), // Evaluated on canonical baseline
      lastUpdated: this.extractLastUpdated(metric.history, s.timestamp),
      history: convertedHistory,
      description: cfg.description,
    };
  });

  readonly pressureModel = computed<TelemetryPanelViewModel | null>(() => {
    const s = this.snapshot();
    if (!s) return null;
    const cfg = METRIC_DISPLAY_CONFIGS.pressure;
    const metric = s.pressure;
    const targetUnit = this.selectedPressureUnit();

    const displayVal = convertPressure(metric.value, targetUnit);
    const convertedHistory: ConvertedHistoryPoint[] = metric.history.map((pt) => ({
      time: pt.time,
      value: Math.round(convertPressure(pt.value, targetUnit) * 10) / 10,
      timestamp: pt.timestamp,
    }));

    return {
      key: 'pressure',
      label: cfg.label,
      canonicalValue: metric.value,
      canonicalUnit: metric.unit,
      displayValue: displayVal,
      displayUnit: targetUnit,
      supportedUnits: SUPPORTED_UNITS.pressure,
      baseline: Math.round(convertPressure(cfg.baseline, targetUnit) * 10) / 10,
      gaugeMin: Math.round(convertPressure(cfg.gaugeMin, targetUnit) * 10) / 10,
      gaugeMax: Math.round(convertPressure(cfg.gaugeMax, targetUnit) * 10) / 10,
      status: calculateMetricStatus(metric.value, cfg.baseline), // Evaluated on canonical baseline
      lastUpdated: this.extractLastUpdated(metric.history, s.timestamp),
      history: convertedHistory,
      description: cfg.description,
    };
  });

  readonly temperatureModel = computed<TelemetryPanelViewModel | null>(() => {
    const s = this.snapshot();
    if (!s) return null;
    const cfg = METRIC_DISPLAY_CONFIGS.temperature;
    const metric = s.temperature;
    const targetUnit = this.selectedTemperatureUnit();

    const displayVal = convertTemperature(metric.value, targetUnit);
    const convertedHistory: ConvertedHistoryPoint[] = metric.history.map((pt) => ({
      time: pt.time,
      value: Math.round(convertTemperature(pt.value, targetUnit) * 10) / 10,
      timestamp: pt.timestamp,
    }));

    return {
      key: 'temperature',
      label: cfg.label,
      canonicalValue: metric.value,
      canonicalUnit: metric.unit,
      displayValue: displayVal,
      displayUnit: targetUnit,
      supportedUnits: SUPPORTED_UNITS.temperature,
      baseline: Math.round(convertTemperature(cfg.baseline, targetUnit) * 10) / 10,
      gaugeMin: Math.round(convertTemperature(cfg.gaugeMin, targetUnit) * 10) / 10,
      gaugeMax: Math.round(convertTemperature(cfg.gaugeMax, targetUnit) * 10) / 10,
      status: calculateMetricStatus(metric.value, cfg.baseline), // Evaluated on canonical baseline
      lastUpdated: this.extractLastUpdated(metric.history, s.timestamp),
      history: convertedHistory,
      description: cfg.description,
    };
  });

  readonly panels = computed<readonly TelemetryPanelViewModel[]>(() => {
    const v = this.velocityModel();
    const p = this.pressureModel();
    const t = this.temperatureModel();
    if (!v || !p || !t) return [];
    return [v, p, t];
  });

  constructor() {
    this.api.getBaseUrl().subscribe({
      next: (url) => this.apiEndpoint.set(url),
      error: () => this.apiEndpoint.set('http://127.0.0.1:3000'),
    });
  }

  readonly refreshing = signal<boolean>(false);

  /**
   * Immediately fetches a fresh telemetry snapshot from the backend.
   * Can be triggered on demand by the user via the Snapshot/Refresh button.
   */
  refreshSnapshot(): void {
    this.refreshing.set(true);
    this.api
      .getDashboard()
      .pipe(
        catchError((err) => {
          this.handlePollingError(err);
          return of(null);
        }),
      )
      .subscribe((data) => {
        if (data) {
          this.handlePollingSuccess(data);
        }
        setTimeout(() => this.refreshing.set(false), 500);
      });
  }

  /**
   * Connects to the real-time Server-Sent Events (SSE) telemetry stream.
   * Leverages push updates from the backend with graceful reconnection
   * and fallback to getDashboard() on demand.
   */
  startPolling(): void {
    this.stopPolling();
    this.consecutiveFailures = 0;

    // Use SSE stream as primary real-time push mechanism
    this.pollingSub = this.api
      .connectTelemetryStream()
      .pipe(
        catchError((err) => {
          this.handlePollingError(err);
          // On SSE error, trigger a one-shot fallback HTTP request and retry stream after 2s
          return this.api.getDashboard().pipe(
            catchError((fallbackErr) => {
              this.handlePollingError(fallbackErr);
              return of(null);
            }),
          );
        }),
      )
      .subscribe((data) => {
        if (data) {
          this.handlePollingSuccess(data);
        }
      });
  }

  stopPolling(): void {
    if (this.pollingSub) {
      this.pollingSub.unsubscribe();
      this.pollingSub = null;
    }
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  setUnit(metricKey: MetricKey, unit: MeasurementUnit): void {
    switch (metricKey) {
      case 'velocity':
        this.selectedVelocityUnit.set(unit as VelocityUnit);
        break;
      case 'pressure':
        this.selectedPressureUnit.set(unit as PressureUnit);
        break;
      case 'temperature':
        this.selectedTemperatureUnit.set(unit as TemperatureUnit);
        break;
    }
  }

  private handlePollingSuccess(data: DashboardResponse): void {
    this.snapshot.set(data);
    this.sessionService.ingestSnapshot(data);
    this.loading.set(false);
    this.errorMessage.set(null);
    this.consecutiveFailures = 0;
    this.connectionState.set('connected');
  }

  private handlePollingError(err: Error): void {
    this.consecutiveFailures++;
    const hasData = this.snapshot() !== null;

    if (!hasData) {
      // Never received data: show error screen
      this.loading.set(false);
      this.connectionState.set('error');
      this.errorMessage.set(
        err.message ||
          'Unable to retrieve telemetry data. Check the local monitoring service and try again.',
      );
    } else {
      // Previously received data: retain readings, mark reconnecting or offline after 3 fails
      if (this.consecutiveFailures >= 3) {
        this.connectionState.set('offline');
      } else {
        this.connectionState.set('reconnecting');
      }
    }
  }

  private extractLastUpdated(history: readonly { time: string }[], fallbackIso: string): string {
    if (history.length > 0 && history[history.length - 1].time) {
      return history[history.length - 1].time;
    }
    const d = new Date(fallbackIso);
    return isNaN(d.getTime())
      ? fallbackIso
      : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { DashboardFacadeService } from './dashboard-facade.service';
import { TelemetryApiService } from '../../../core/api/telemetry-api.service';
import { TelemetrySessionService } from '../../../core/services/telemetry-session.service';
import { DashboardResponse, CANONICAL_BASELINES } from 'telemetry-contracts';

describe('DashboardFacadeService - Fallback & Error Recovery', () => {
  let service: DashboardFacadeService;
  let mockApi: {
    getBaseUrl: ReturnType<typeof vi.fn>;
    getDashboard: ReturnType<typeof vi.fn>;
    connectTelemetryStream: ReturnType<typeof vi.fn>;
  };
  let mockSession: {
    ingestSnapshot: ReturnType<typeof vi.fn>;
    records: ReturnType<typeof vi.fn>;
  };

  const sampleSnapshot: DashboardResponse = {
    timestamp: '2026-10-16T12:00:00.000Z',
    velocity: {
      value: 185.4,
      unit: 'cm/s',
      history: [{ time: '12:00:00', value: 185.4, timestamp: '2026-10-16T12:00:00.000Z' }],
    },
    pressure: {
      value: 1012,
      unit: 'mbar',
      history: [{ time: '12:00:00', value: 1012, timestamp: '2026-10-16T12:00:00.000Z' }],
    },
    temperature: {
      value: 36.8,
      unit: '°C',
      history: [{ time: '12:00:00', value: 36.8, timestamp: '2026-10-16T12:00:00.000Z' }],
    },
  };

  beforeEach(() => {
    mockApi = {
      getBaseUrl: vi.fn().mockReturnValue(of('http://127.0.0.1:3000')),
      getDashboard: vi.fn().mockReturnValue(of(sampleSnapshot)),
      connectTelemetryStream: vi.fn().mockReturnValue(of(sampleSnapshot)),
    };

    mockSession = {
      ingestSnapshot: vi.fn(),
      records: vi.fn().mockReturnValue([]),
    };

    TestBed.configureTestingModule({
      providers: [
        DashboardFacadeService,
        { provide: TelemetryApiService, useValue: mockApi },
        { provide: TelemetrySessionService, useValue: mockSession },
      ],
    });

    service = TestBed.inject(DashboardFacadeService);
  });

  afterEach(() => {
    service.stopPolling();
    vi.restoreAllMocks();
  });

  it('connects to SSE stream and transitions to connected state on success', () => {
    service.startPolling();

    expect(mockApi.connectTelemetryStream).toHaveBeenCalledTimes(1);
    expect(service.connectionState()).toBe('connected');
    expect(service.loading()).toBe(false);
    expect(service.errorMessage()).toBeNull();
    expect(service.snapshot()).toEqual(sampleSnapshot);
    expect(mockSession.ingestSnapshot).toHaveBeenCalledWith(sampleSnapshot);
  });

  it('activates fallback getDashboard() HTTP request when SSE stream errors on startup', () => {
    const sseError = new Error('SSE stream connection refused');
    mockApi.connectTelemetryStream.mockReturnValue(throwError(() => sseError));
    mockApi.getDashboard.mockReturnValue(of(sampleSnapshot));

    service.startPolling();

    // Verify SSE was attempted
    expect(mockApi.connectTelemetryStream).toHaveBeenCalledTimes(1);
    // Verify fallback getDashboard() was invoked
    expect(mockApi.getDashboard).toHaveBeenCalledTimes(1);

    // Fallback succeeded: UI shows data
    expect(service.connectionState()).toBe('connected');
    expect(service.snapshot()).toEqual(sampleSnapshot);
    expect(service.loading()).toBe(false);
  });

  it('transitions to error state when both SSE stream and HTTP fallback fail with no prior data', () => {
    mockApi.connectTelemetryStream.mockReturnValue(throwError(() => new Error('SSE unreachable')));
    mockApi.getDashboard.mockReturnValue(
      throwError(() => new Error('Service Unavailable (HTTP 503)')),
    );

    service.startPolling();

    expect(service.connectionState()).toBe('error');
    expect(service.errorMessage()).toContain('Service Unavailable');
    expect(service.snapshot()).toBeNull();
    expect(service.loading()).toBe(false);
  });

  it('retains previous valid readings when connection fails after data was already received', () => {
    // 1. Initial successful connection
    const sseSubject = new Subject<DashboardResponse>();
    mockApi.connectTelemetryStream.mockReturnValue(sseSubject.asObservable());
    mockApi.getDashboard.mockReturnValue(throwError(() => new Error('Fallback failed')));

    service.startPolling();
    sseSubject.next(sampleSnapshot);

    expect(service.connectionState()).toBe('connected');
    expect(service.snapshot()).toEqual(sampleSnapshot);

    // 2. Simulate stream failure after having received valid data
    sseSubject.error(new Error('Connection lost'));

    // Verify readings are retained (not wiped)
    expect(service.snapshot()).toEqual(sampleSnapshot);
    // Verify state transitioned to reconnecting (not fatal error)
    expect(service.connectionState()).toBe('reconnecting');
  });

  it('cleans up stream subscription when stopPolling() or ngOnDestroy() is called', () => {
    const sseSubject = new Subject<DashboardResponse>();
    mockApi.connectTelemetryStream.mockReturnValue(sseSubject.asObservable());

    service.startPolling();
    expect(sseSubject.observed).toBe(true);

    service.stopPolling();
    expect(sseSubject.observed).toBe(false);

    // Idempotent stop
    service.stopPolling();
    expect(sseSubject.observed).toBe(false);
  });

  it('does not create duplicate subscriptions if startPolling() is called multiple times', () => {
    const sseSubject = new Subject<DashboardResponse>();
    mockApi.connectTelemetryStream.mockReturnValue(sseSubject.asObservable());

    service.startPolling();
    service.startPolling();
    service.startPolling();

    expect(mockApi.connectTelemetryStream).toHaveBeenCalledTimes(3);
    // But only 1 active subscription is kept
    expect(sseSubject.observers.length).toBe(1);
  });

  it('refreshes snapshot on-demand via refreshSnapshot() and handles network error', () => {
    mockApi.getDashboard.mockReturnValue(throwError(() => new Error('Gateway Timeout')));

    service.refreshSnapshot();

    expect(mockApi.getDashboard).toHaveBeenCalled();
    expect(service.connectionState()).toBe('error');
  });

  it('transitions from reconnecting to offline after 3 consecutive failures when prior data exists', () => {
    const sseSubject = new Subject<DashboardResponse>();
    mockApi.connectTelemetryStream.mockReturnValue(sseSubject.asObservable());

    service.startPolling();
    sseSubject.next(sampleSnapshot);
    expect(service.connectionState()).toBe('connected');

    // 1 failure
    (service as any).handlePollingError(new Error('fail 1'));
    expect(service.connectionState()).toBe('reconnecting');

    // 2 failures
    (service as any).handlePollingError(new Error('fail 2'));
    expect(service.connectionState()).toBe('reconnecting');

    // 3 failures -> offline
    (service as any).handlePollingError(new Error('fail 3'));
    expect(service.connectionState()).toBe('offline');
  });

  it('updates unit state via setUnit() for velocity, pressure, and temperature', () => {
    service.setUnit('velocity', 'm/s');
    expect(service.selectedVelocityUnit()).toBe('m/s');

    service.setUnit('pressure', 'psi');
    expect(service.selectedPressureUnit()).toBe('psi');

    service.setUnit('temperature', '°F');
    expect(service.selectedTemperatureUnit()).toBe('°F');
  });

  it('formats lastUpdated gracefully when history is empty or fallback date is invalid', () => {
    const resValid = (service as any).extractLastUpdated([], '2026-10-16T12:00:00.000Z');
    expect(resValid).toBeTruthy();

    const resInvalid = (service as any).extractLastUpdated([], 'not-a-valid-date');
    expect(resInvalid).toBe('not-a-valid-date');
  });
});

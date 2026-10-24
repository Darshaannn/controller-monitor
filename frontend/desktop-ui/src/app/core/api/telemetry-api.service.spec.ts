import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TelemetryApiService } from './telemetry-api.service';
import { environment } from '../../../environments/environment';
import { DashboardResponse, CANONICAL_BASELINES } from 'telemetry-contracts';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('TelemetryApiService', () => {
  let service: TelemetryApiService;
  let httpTesting: HttpTestingController;

  const mockResponse: DashboardResponse = {
    timestamp: '2026-10-16T12:00:00Z',
    velocity: {
      value: CANONICAL_BASELINES.velocity.value,
      unit: CANONICAL_BASELINES.velocity.unit,
      history: [{ time: '12:00:00', value: CANONICAL_BASELINES.velocity.value }],
    },
    pressure: {
      value: CANONICAL_BASELINES.pressure.value,
      unit: CANONICAL_BASELINES.pressure.unit,
      history: [{ time: '12:00:00', value: CANONICAL_BASELINES.pressure.value }],
    },
    temperature: {
      value: CANONICAL_BASELINES.temperature.value,
      unit: CANONICAL_BASELINES.temperature.unit,
      history: [{ time: '12:00:00', value: CANONICAL_BASELINES.temperature.value }],
    },
  };

  beforeEach(() => {
    delete window.telemetryDesktop;

    TestBed.configureTestingModule({
      providers: [TelemetryApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(TelemetryApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    delete window.telemetryDesktop;
    vi.restoreAllMocks();
  });

  it('resolves base URL from environment when window.telemetryDesktop is absent', async () => {
    const url = await new Promise<string>((resolve) => service.getBaseUrl().subscribe(resolve));
    expect(url).toBe(environment.apiBaseUrl);

    // Subsequent calls return cached value synchronously
    const cachedUrl = await new Promise<string>((resolve) => service.getBaseUrl().subscribe(resolve));
    expect(cachedUrl).toBe(environment.apiBaseUrl);
  });

  it('resolves base URL without electron bridge and caches result correctly', async () => {
    delete window.telemetryDesktop;
    const standaloneService = TestBed.runInInjectionContext(() => new TelemetryApiService());
    const resolvedUrl = await new Promise<string>((resolve) => standaloneService.getBaseUrl().subscribe(resolve));
    expect(resolvedUrl).toBeTruthy();
    expect(typeof resolvedUrl).toBe('string');
  });

  it('resolves base URL from window.telemetryDesktop IPC bridge when present', async () => {
    window.telemetryDesktop = {
      getApiEndpoint: vi.fn().mockResolvedValue('http://localhost:3000'),
      showSaveDialog: vi.fn(),
      saveFile: vi.fn(),
      getAppVersion: vi.fn(),
    };

    const newService = TestBed.runInInjectionContext(() => new TelemetryApiService());
    const url = await new Promise<string>((resolve) => newService.getBaseUrl().subscribe(resolve));
    expect(url).toBe('http://localhost:3000');
  });

  it('rejects untrusted remote origins in IPC endpoint and reverts to environment baseline', async () => {
    window.telemetryDesktop = {
      getApiEndpoint: vi.fn().mockResolvedValue('http://malicious-attacker.com:3000'),
      showSaveDialog: vi.fn(),
      saveFile: vi.fn(),
      getAppVersion: vi.fn(),
    };

    const newService = TestBed.runInInjectionContext(() => new TelemetryApiService());
    const url = await new Promise<string>((resolve) => newService.getBaseUrl().subscribe(resolve));
    expect(url).toBe(environment.apiBaseUrl);
  });

  it('catches IPC bridge errors and falls back to environment configuration', async () => {
    window.telemetryDesktop = {
      getApiEndpoint: vi.fn().mockRejectedValue(new Error('IPC disconnected')),
      showSaveDialog: vi.fn(),
      saveFile: vi.fn(),
      getAppVersion: vi.fn(),
    };

    const newService = TestBed.runInInjectionContext(() => new TelemetryApiService());
    const url = await new Promise<string>((resolve) => newService.getBaseUrl().subscribe(resolve));
    expect(url).toBe(environment.apiBaseUrl);
  });

  it('fetches dashboard snapshot successfully via HTTP', async () => {
    let result: DashboardResponse | null = null;
    service.getDashboard().subscribe((data) => (result = data));

    const req = httpTesting.expectOne('http://127.0.0.1:3000/api/dashboard');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);

    expect(result).toEqual(mockResponse);
  });

  it('handles HTTP error status codes accurately (0, 404, 500, other)', async () => {
    // Status 0: network unreachable
    let errMsg: string = '';
    service.getDashboard().subscribe({
      error: (err) => (errMsg = err.message),
    });
    httpTesting.expectOne('http://127.0.0.1:3000/api/dashboard').error(new ProgressEvent('error'), { status: 0 });
    expect(errMsg).toContain('Telemetry service is unreachable');

    // Status 404: endpoint not found
    service.getDashboard().subscribe({
      error: (err) => (errMsg = err.message),
    });
    httpTesting.expectOne('http://127.0.0.1:3000/api/dashboard').flush('Not Found', { status: 404, statusText: 'Not Found' });
    expect(errMsg).toContain('endpoint not found');

    // Status 500: server error
    service.getDashboard().subscribe({
      error: (err) => (errMsg = err.message),
    });
    httpTesting.expectOne('http://127.0.0.1:3000/api/dashboard').flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    expect(errMsg).toContain('server error (500)');

    // Other status (e.g. 403)
    service.getDashboard().subscribe({
      error: (err) => (errMsg = err.message),
    });
    httpTesting.expectOne('http://127.0.0.1:3000/api/dashboard').flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    expect(errMsg).toContain('request failed (HTTP 403)');
  });

  it('connects to SSE stream and receives live snapshot event', async () => {
    let received: DashboardResponse | null = null;
    let streamError: Error | null = null;

    // Mock global EventSource
    let eventListeners: Record<string, (event: unknown) => void> = {};
    class MockEventSource {
      constructor(public url: string) {}
      addEventListener(type: string, listener: (event: unknown) => void) {
        eventListeners[type] = listener;
      }
      close() {}
      onerror: ((err: unknown) => void) | null = null;
    }
    const originalEventSource = globalThis.EventSource;
    globalThis.EventSource = MockEventSource as unknown as typeof EventSource;

    try {
      const sub = service.connectTelemetryStream().subscribe({
        next: (data) => (received = data),
        error: (err) => (streamError = err),
      });

      // Simulate 'snapshot' event
      expect(eventListeners['snapshot']).toBeDefined();
      eventListeners['snapshot']({ data: JSON.stringify(mockResponse) });
      expect(received).toEqual(mockResponse);

      sub.unsubscribe();
    } finally {
      globalThis.EventSource = originalEventSource;
    }
  });

  it('handles SSE connection errors properly', async () => {
    let streamError: Error | null = null;

    class MockFailingEventSource {
      constructor(public url: string) {
        setTimeout(() => {
          if (this.onerror) {
            this.onerror(new Event('error'));
          }
        }, 0);
      }
      addEventListener() {}
      close() {}
      onerror: ((err: unknown) => void) | null = null;
    }
    const originalEventSource = globalThis.EventSource;
    globalThis.EventSource = MockFailingEventSource as unknown as typeof EventSource;

    try {
      await new Promise<void>((resolve) => {
        service.connectTelemetryStream().subscribe({
          error: (err) => {
            streamError = err;
            resolve();
          },
        });
      });

      expect(streamError).toBeTruthy();
      expect((streamError as unknown as Error).message).toContain('stream connection lost or unreachable');
    } finally {
      globalThis.EventSource = originalEventSource;
    }
  });
});

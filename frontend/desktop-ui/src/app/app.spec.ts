import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AppComponent } from './app';
import { CANONICAL_BASELINES } from 'telemetry-contracts';
import { DashboardFacadeService } from './features/dashboard/services/dashboard-facade.service';

describe('AppComponent (Sprint 1 Integration)', () => {
  let httpTesting: HttpTestingController;
  let facade: DashboardFacadeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
    facade = TestBed.inject(DashboardFacadeService);
  });

  afterEach(() => {
    facade.stopPolling();
    httpTesting.verify();
  });

  it('renders application header, telemetry panels, and values from API', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    // Verify initial request
    const req = httpTesting.expectOne('http://127.0.0.1:3000/api/dashboard');
    expect(req.request.method).toBe('GET');

    req.flush({
      timestamp: '2026-10-16T15:00:00Z',
      velocity: {
        value: CANONICAL_BASELINES.velocity.value,
        unit: CANONICAL_BASELINES.velocity.unit,
        history: [{ time: '15:00:00', value: CANONICAL_BASELINES.velocity.value }],
      },
      pressure: {
        value: CANONICAL_BASELINES.pressure.value,
        unit: CANONICAL_BASELINES.pressure.unit,
        history: [{ time: '15:00:00', value: CANONICAL_BASELINES.pressure.value }],
      },
      temperature: {
        value: CANONICAL_BASELINES.temperature.value,
        unit: CANONICAL_BASELINES.temperature.unit,
        history: [{ time: '15:00:00', value: CANONICAL_BASELINES.temperature.value }],
      },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Controller Monitor');
    expect(compiled.textContent).toContain('Real-Time Telemetry');
    expect(compiled.textContent).toContain('Velocity');
    expect(compiled.textContent).toContain('Pressure');
    expect(compiled.textContent).toContain('Temperature');

    // Values verified
    expect(compiled.textContent).toContain('185.4');
    expect(compiled.textContent).toContain('1012');
    expect(compiled.textContent).toContain('36.8');
  });

  it('displays error component when API fails and retries on action', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const req = httpTesting.expectOne('http://127.0.0.1:3000/api/dashboard');
    req.error(new ProgressEvent('Network error'));

    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Telemetry Communication Failure');

    // Trigger retry button
    const retryBtn = compiled.querySelector(
      'button[aria-label="Retry connection to telemetry service"]',
    ) as HTMLButtonElement;
    expect(retryBtn).toBeTruthy();
    retryBtn.click();

    fixture.detectChanges();
    const retryReq = httpTesting.expectOne('http://127.0.0.1:3000/api/dashboard');
    expect(retryReq.request.method).toBe('GET');
  });

  it('changes units on the fly without making extra backend network calls', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const req = httpTesting.expectOne('http://127.0.0.1:3000/api/dashboard');
    req.flush({
      timestamp: '2026-10-16T15:00:00Z',
      velocity: {
        value: 100, // 100 cm/s
        unit: 'cm/s',
        history: [{ time: '15:00:00', value: 100 }],
      },
      pressure: {
        value: 1000, // 1000 mbar
        unit: 'mbar',
        history: [{ time: '15:00:00', value: 1000 }],
      },
      temperature: {
        value: 20, // 20 °C
        unit: '°C',
        history: [{ time: '15:00:00', value: 20 }],
      },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    // Switch velocity from cm/s to m/s (100 cm/s = 1.0 m/s)
    facade.setUnit('velocity', 'm/s');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(facade.velocityModel()?.displayValue).toBe(1);
    expect(facade.velocityModel()?.displayUnit).toBe('m/s');
    expect(facade.velocityModel()?.canonicalValue).toBe(100);

    // Switch temperature from °C to °F (20 °C = 68 °F)
    facade.setUnit('temperature', '°F');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(facade.temperatureModel()?.displayValue).toBe(68);
    expect(facade.temperatureModel()?.displayUnit).toBe('°F');

    // CRITICAL: verify zero additional requests were made for unit changes!
    httpTesting.verify();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardPageComponent } from './dashboard-page.component';
import { DashboardFacadeService } from './services/dashboard-facade.service';
import { signal } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TelemetryPanelViewModel } from '../../core/models/dashboard-view.model';

describe('DashboardPageComponent', () => {
  let component: DashboardPageComponent;
  let fixture: ComponentFixture<DashboardPageComponent>;
  let mockFacade: {
    loading: ReturnType<typeof signal<boolean>>;
    refreshing: ReturnType<typeof signal<boolean>>;
    errorMessage: ReturnType<typeof signal<string | null>>;
    panels: ReturnType<typeof signal<readonly TelemetryPanelViewModel[]>>;
    refreshSnapshot: ReturnType<typeof vi.fn>;
    startPolling: ReturnType<typeof vi.fn>;
    setUnit: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockFacade = {
      loading: signal(false),
      refreshing: signal(false),
      errorMessage: signal<string | null>(null),
      panels: signal<readonly TelemetryPanelViewModel[]>([]),
      refreshSnapshot: vi.fn(),
      startPolling: vi.fn(),
      setUnit: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [{ provide: DashboardFacadeService, useValue: mockFacade }],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders skeleton component when loading is true', () => {
    mockFacade.loading.set(true);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-dashboard-skeleton')).toBeTruthy();
  });

  it('renders error component when errorMessage is set', () => {
    mockFacade.loading.set(false);
    mockFacade.errorMessage.set('Connection lost');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-dashboard-error')).toBeTruthy();
  });

  it('calls facade.refreshSnapshot when refresh is triggered', () => {
    component.onRefresh();
    expect(mockFacade.refreshSnapshot).toHaveBeenCalledTimes(1);
  });

  it('calls facade.startPolling when retry is triggered', () => {
    component.onRetry();
    expect(mockFacade.startPolling).toHaveBeenCalledTimes(1);
  });

  it('calls facade.setUnit when unit change event occurs', () => {
    component.onUnitChange({ key: 'velocity', unit: 'm/s' });
    expect(mockFacade.setUnit).toHaveBeenCalledWith('velocity', 'm/s');
  });
});

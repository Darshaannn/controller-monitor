import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TelemetryChartComponent } from './telemetry-chart.component';
import { ThemeService } from '../../../core/services/theme.service';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Chart } from 'chart.js';

describe('TelemetryChartComponent', () => {
  let component: TelemetryChartComponent;
  let fixture: ComponentFixture<TelemetryChartComponent>;
  let mockThemeService: {
    currentTheme: ReturnType<typeof signal<'dark' | 'light'>>;
    toggleTheme: ReturnType<typeof vi.fn>;
  };

  const sampleHistory = [
    { time: '12:00:00', value: 180 },
    { time: '12:00:01', value: 185 },
  ];

  beforeEach(async () => {
    mockThemeService = {
      currentTheme: signal<'dark' | 'light'>('dark'),
      toggleTheme: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TelemetryChartComponent],
      providers: [{ provide: ThemeService, useValue: mockThemeService }],
    }).compileComponents();

    fixture = TestBed.createComponent(TelemetryChartComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('metricKey', 'velocity');
    fixture.componentRef.setInput('history', sampleHistory);
    fixture.componentRef.setInput('unit', 'cm/s');
    fixture.componentRef.setInput('label', 'Velocity');
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('instantiates component and sets initial zoom state to false', () => {
    expect(component).toBeTruthy();
    expect(component.isZoomed()).toBe(false);
  });

  it('determines theme colors correctly for velocity, pressure, and temperature', () => {
    // velocity
    fixture.componentRef.setInput('metricKey', 'velocity');
    fixture.detectChanges();
    expect((component as unknown as { themeColors: () => { border: string } }).themeColors().border).toBe('#16a34a');

    // pressure
    fixture.componentRef.setInput('metricKey', 'pressure');
    fixture.detectChanges();
    expect((component as unknown as { themeColors: () => { border: string } }).themeColors().border).toBe('#eab308');

    // temperature
    fixture.componentRef.setInput('metricKey', 'temperature');
    fixture.detectChanges();
    expect((component as unknown as { themeColors: () => { border: string } }).themeColors().border).toBe('#dc2626');
  });

  it('handles zoom controls safely when chartInstance is present or absent', () => {
    const mockChart = {
      zoom: vi.fn(),
      resetZoom: vi.fn(),
      destroy: vi.fn(),
    } as unknown as Chart<'line'>;

    (component as unknown as { chartInstance: Chart<'line'> | null }).chartInstance = mockChart;

    component.zoomIn();
    expect(mockChart.zoom).toHaveBeenCalledWith(1.2);
    expect(component.isZoomed()).toBe(true);

    component.zoomOut();
    expect(mockChart.zoom).toHaveBeenCalledWith(0.8);
    expect(component.isZoomed()).toBe(true);

    component.resetZoom();
    expect(mockChart.resetZoom).toHaveBeenCalled();
    expect(component.isZoomed()).toBe(false);

    // Without chart instance
    (component as unknown as { chartInstance: Chart<'line'> | null }).chartInstance = null;
    expect(() => component.zoomIn()).not.toThrow();
    expect(() => component.zoomOut()).not.toThrow();
    expect(() => component.resetZoom()).not.toThrow();
  });
});

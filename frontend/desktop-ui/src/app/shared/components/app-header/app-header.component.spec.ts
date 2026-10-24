import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppHeaderComponent } from './app-header.component';
import { TelemetryExportService, ExportStatus } from '../../../core/services/telemetry-export.service';
import { ThemeService } from '../../../core/services/theme.service';
import { signal } from '@angular/core';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('AppHeaderComponent', () => {
  let component: AppHeaderComponent;
  let fixture: ComponentFixture<AppHeaderComponent>;
  let mockExportService: {
    exportCsv: ReturnType<typeof vi.fn>;
    exportExcel: ReturnType<typeof vi.fn>;
  };
  let mockThemeService: {
    currentTheme: ReturnType<typeof signal<'dark' | 'light'>>;
    toggleTheme: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockExportService = {
      exportCsv: vi.fn().mockResolvedValue('success'),
      exportExcel: vi.fn().mockResolvedValue('success'),
    };

    mockThemeService = {
      currentTheme: signal<'dark' | 'light'>('dark'),
      toggleTheme: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AppHeaderComponent],
      providers: [
        { provide: TelemetryExportService, useValue: mockExportService },
        { provide: ThemeService, useValue: mockThemeService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppHeaderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('connectionState', 'connected');
    fixture.componentRef.setInput('apiEndpoint', 'http://127.0.0.1:3000');
    fixture.componentRef.setInput('lastUpdated', '12:00:00');
    fixture.detectChanges();
  });

  it('renders branding title and subtitle', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Controller Monitor');
    expect(el.textContent).toContain('Real-Time Telemetry Dashboard');
  });

  it('toggles theme when theme toggle button is clicked', () => {
    component.toggleTheme();
    expect(mockThemeService.toggleTheme).toHaveBeenCalledTimes(1);
  });

  it('toggles and closes dropdown', () => {
    expect(component.isDropdownOpen()).toBe(false);
    component.toggleDropdown();
    expect(component.isDropdownOpen()).toBe(true);
    component.closeDropdown();
    expect(component.isDropdownOpen()).toBe(false);
  });

  it('executes exportCsv and handles success message with auto-clear', async () => {
    vi.useFakeTimers();
    mockExportService.exportCsv.mockResolvedValueOnce('success');
    await component.exportCsv();

    expect(component.exportStatus()).toBe('success');
    expect(component.statusMessage()).toBe('CSV exported successfully');

    vi.advanceTimersByTime(3500);
    expect(component.exportStatus()).toBe('idle');
    expect(component.statusMessage()).toBe('');
    vi.useRealTimers();
  });

  it('executes exportExcel and handles success message', async () => {
    vi.useFakeTimers();
    mockExportService.exportExcel.mockResolvedValueOnce('success');
    await component.exportExcel();

    expect(component.exportStatus()).toBe('success');
    expect(component.statusMessage()).toBe('Excel exported successfully');

    vi.advanceTimersByTime(3500);
    expect(component.exportStatus()).toBe('idle');
    vi.useRealTimers();
  });

  it('handles cancelled, empty, and error export results appropriately', async () => {
    mockExportService.exportCsv.mockResolvedValueOnce('cancelled');
    await component.exportCsv();
    expect(component.statusMessage()).toBe('Export cancelled');

    mockExportService.exportCsv.mockResolvedValueOnce('empty');
    await component.exportCsv();
    expect(component.statusMessage()).toBe('No telemetry data available to export');

    mockExportService.exportCsv.mockResolvedValueOnce('error');
    await component.exportCsv();
    expect(component.statusMessage()).toBe('Failed to export CSV');
  });
});

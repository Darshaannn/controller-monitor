import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ThemeService, AppTheme } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [ThemeService],
    });
    service = TestBed.inject(ThemeService);
  });

  it('initializes with default light theme when no preference is saved', () => {
    expect(service.currentTheme()).toBe('light');
  });

  it('toggles theme between light and dark', () => {
    expect(service.currentTheme()).toBe('light');
    service.toggleTheme();
    expect(service.currentTheme()).toBe('dark');
    service.toggleTheme();
    expect(service.currentTheme()).toBe('light');
  });

  it('falls back safely to default theme when localStorage has an invalid theme string', () => {
    localStorage.setItem('telemetry_monitor_theme', 'neon-cyberpunk' as AppTheme);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [ThemeService],
    });
    const restoredService = TestBed.inject(ThemeService);
    expect(restoredService.currentTheme()).toBe('light');
  });

  it('handles localStorage exceptions gracefully without crashing', () => {
    const originalGetItem = localStorage.getItem.bind(localStorage);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
      throw new Error('SecurityError: Access to localStorage is denied');
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [ThemeService],
    });
    const restoredService = TestBed.inject(ThemeService);
    expect(restoredService.currentTheme()).toBe('light');

    // Also verify setTheme doesn't throw if setItem throws
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => restoredService.setTheme('dark')).not.toThrow();
  });

  it('restores dark theme when saved in localStorage', () => {
    localStorage.setItem('telemetry_monitor_theme', 'dark');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [ThemeService],
    });
    const restoredService = TestBed.inject(ThemeService);
    expect(restoredService.currentTheme()).toBe('dark');
  });

  it('detects system light theme preference via matchMedia when no localStorage value exists', () => {
    localStorage.clear();
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      media: '(prefers-color-scheme: light)',
    }) as any;

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [ThemeService],
    });
    const restoredService = TestBed.inject(ThemeService);
    expect(restoredService.currentTheme()).toBe('light');

    window.matchMedia = originalMatchMedia;
  });
});

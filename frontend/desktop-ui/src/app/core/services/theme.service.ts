import { Injectable, signal, effect } from '@angular/core';
import type { AppTheme } from '../types';

export type { AppTheme };

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_STORAGE_KEY = 'telemetry_monitor_theme';

  // Default theme is dark as defined in architectural baseline
  readonly currentTheme = signal<AppTheme>(this.getInitialTheme());

  constructor() {
    // Automatically apply theme attribute to root element whenever theme changes
    effect(() => {
      const theme = this.currentTheme();
      this.applyTheme(theme);
    });
  }

  private getInitialTheme(): AppTheme {
    try {
      const stored = localStorage.getItem(this.THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
      // Check system preference
      if (
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: light)').matches
      ) {
        return 'light';
      }
      // Default to light for clean white/gray aesthetic
    } catch {
      // Fallback if localStorage is inaccessible
    }
    return 'light';
  }

  toggleTheme(): void {
    const next = this.currentTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  }

  setTheme(theme: AppTheme): void {
    this.currentTheme.set(theme);
    try {
      localStorage.setItem(this.THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }

  private applyTheme(theme: AppTheme): void {
    if (typeof document !== 'undefined') {
      const html = document.documentElement;
      html.setAttribute('data-bs-theme', theme);
      html.setAttribute('data-theme', theme);
    }
  }
}

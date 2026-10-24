import { Component, input, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConnectionIndicatorComponent } from '../connection-indicator/connection-indicator.component';
import { ConnectionState } from '../../../core/models/dashboard-view.model';
import {
  TelemetryExportService,
  ExportStatus,
} from '../../../core/services/telemetry-export.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ConnectionIndicatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.scss',
})
export class AppHeaderComponent {
  readonly connectionState = input.required<ConnectionState>();
  readonly apiEndpoint = input<string>('');
  readonly lastUpdated = input<string | null>(null);

  readonly exportService = inject(TelemetryExportService);
  readonly themeService = inject(ThemeService);

  readonly exportStatus = signal<ExportStatus>('idle');
  readonly statusMessage = signal<string>('');
  readonly isDropdownOpen = signal<boolean>(false);

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleDropdown(): void {
    this.isDropdownOpen.update((open) => !open);
  }

  closeDropdown(): void {
    this.isDropdownOpen.set(false);
  }

  async exportCsv(): Promise<void> {
    this.closeDropdown();
    this.exportStatus.set('exporting');
    this.statusMessage.set('Exporting CSV...');
    const result = await this.exportService.exportCsv();
    this.handleExportResult(result, 'CSV');
  }

  async exportExcel(): Promise<void> {
    this.closeDropdown();
    this.exportStatus.set('exporting');
    this.statusMessage.set('Exporting Excel...');
    const result = await this.exportService.exportExcel();
    this.handleExportResult(result, 'Excel');
  }

  private handleExportResult(result: ExportStatus, format: string): void {
    this.exportStatus.set(result);
    switch (result) {
      case 'success':
        this.statusMessage.set(`${format} exported successfully`);
        break;
      case 'cancelled':
        this.statusMessage.set('Export cancelled');
        break;
      case 'empty':
        this.statusMessage.set('No telemetry data available to export');
        break;
      case 'error':
        this.statusMessage.set(`Failed to export ${format}`);
        break;
      default:
        this.statusMessage.set('');
    }

    // Auto-clear message after 3.5 seconds
    if (result !== 'exporting') {
      setTimeout(() => {
        if (this.exportStatus() === result) {
          this.exportStatus.set('idle');
          this.statusMessage.set('');
        }
      }, 3500);
    }
  }
}

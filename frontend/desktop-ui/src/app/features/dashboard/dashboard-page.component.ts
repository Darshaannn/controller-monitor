import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardFacadeService } from './services/dashboard-facade.service';
import { TelemetryCardComponent } from './components/telemetry-card/telemetry-card.component';
import { DashboardSkeletonComponent } from './components/dashboard-skeleton/dashboard-skeleton.component';
import { DashboardErrorComponent } from './components/dashboard-error/dashboard-error.component';

import { MetricKey, MeasurementUnit } from 'telemetry-contracts';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    TelemetryCardComponent,
    DashboardSkeletonComponent,
    DashboardErrorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent {
  protected readonly facade = inject(DashboardFacadeService);

  onRefresh(): void {
    this.facade.refreshSnapshot();
  }

  onRetry(): void {
    this.facade.startPolling();
  }

  onUnitChange(event: { key: MetricKey; unit: MeasurementUnit }): void {
    this.facade.setUnit(event.key, event.unit);
  }
}

import { Component, input, output, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CircularGaugeComponent } from '../../../../shared/components/circular-gauge/circular-gauge.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { TelemetryChartComponent } from '../../../../shared/components/telemetry-chart/telemetry-chart.component';
import { MetricKey, MeasurementUnit } from 'telemetry-contracts';
import { TelemetryPanelViewModel } from '../../../../core/models/dashboard-view.model';
import { formatMeasurement } from '../../../../core/utilities/unit-conversion.util';

@Component({
  selector: 'app-telemetry-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CircularGaugeComponent,
    StatusBadgeComponent,
    TelemetryChartComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './telemetry-card.component.html',
  styleUrl: './telemetry-card.component.scss',
})
export class TelemetryCardComponent {
  readonly model = input.required<TelemetryPanelViewModel>();
  readonly unitChange = output<{ key: MetricKey; unit: MeasurementUnit }>();

  readonly deviationPercent = computed(() => {
    const val = this.model().displayValue;
    const base = this.model().baseline;
    if (base === 0) return 0;
    return ((val - base) / base) * 100;
  });

  readonly formattedDeviation = computed(() => {
    const dev = this.deviationPercent();
    const sign = dev > 0 ? '+' : '';
    return `${sign}${dev.toFixed(1)}%`;
  });

  readonly formattedDisplayValue = computed(() => {
    return formatMeasurement(this.model().displayValue, this.model().displayUnit);
  });

  readonly iconSrc = computed(() => {
    switch (this.model().key) {
      case 'velocity':
        return 'assets/icons/velocity.png';
      case 'pressure':
        return 'assets/icons/pressure.png';
      case 'temperature':
        return 'assets/icons/temperature.png';
      default:
        return 'assets/icons/velocity.png';
    }
  });

  readonly isDropdownOpen = signal<boolean>(false);

  toggleDropdown(): void {
    this.isDropdownOpen.update((open) => !open);
  }

  closeDropdown(): void {
    this.isDropdownOpen.set(false);
  }

  onUnitSelect(newUnit: MeasurementUnit): void {
    this.isDropdownOpen.set(false);
    if (newUnit !== this.model().displayUnit) {
      this.unitChange.emit({ key: this.model().key, unit: newUnit });
    }
  }
}

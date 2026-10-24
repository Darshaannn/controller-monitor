import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MetricStatus, MeasurementUnit } from 'telemetry-contracts';
import { formatMeasurement } from '../../../core/utilities/unit-conversion.util';

@Component({
  selector: 'app-circular-gauge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './circular-gauge.component.html',
  styleUrl: './circular-gauge.component.scss',
})
export class CircularGaugeComponent {
  readonly value = input.required<number>();
  readonly min = input<number>(0);
  readonly max = input<number>(100);
  readonly unit = input<MeasurementUnit>('cm/s');
  readonly label = input<string>('Metric');
  readonly status = input<MetricStatus>('normal');

  // Gauge SVG circle dimensions - compact, refined proportions
  readonly size = 120;
  readonly strokeWidth = 10;
  readonly center = 60;
  readonly radius = 48; // center - strokeWidth - padding
  readonly circumference = 2 * Math.PI * 48; // ~301.59

  // Angular progress mapping from 0 to 1
  readonly normalizedProgress = computed(() => {
    const val = this.value();
    const minVal = this.min();
    const maxVal = this.max();

    if (!Number.isFinite(val) || !Number.isFinite(minVal) || !Number.isFinite(maxVal)) {
      return 0;
    }
    if (maxVal <= minVal) {
      return 0;
    }

    const clamped = Math.max(minVal, Math.min(maxVal, val));
    return (clamped - minVal) / (maxVal - minVal);
  });

  // Calculate SVG stroke-dashoffset for the foreground arc
  // We use a 270-degree arc (3/4 circle) for professional gauge aesthetics
  readonly arcLength = computed(() => this.circumference * 0.75); // 339.29
  readonly arcOffset = computed(() => {
    const progress = this.normalizedProgress();
    return this.arcLength() * (1 - progress);
  });

  readonly statusColorClass = computed(() => {
    switch (this.status()) {
      case 'normal':
        return 'gauge-status-normal';
      case 'warning':
        return 'gauge-status-warning';
      case 'critical':
        return 'gauge-status-critical';
      default:
        return 'gauge-status-normal';
    }
  });

  readonly formattedValue = computed(() => {
    const val = this.value();
    if (!Number.isFinite(val)) return '--';
    return formatMeasurement(val, this.unit());
  });
}

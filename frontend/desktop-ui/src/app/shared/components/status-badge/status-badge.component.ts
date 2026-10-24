import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MetricStatus } from 'telemetry-contracts';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss',
})
export class StatusBadgeComponent {
  readonly status = input.required<MetricStatus>();

  readonly label = computed(() => {
    switch (this.status()) {
      case 'normal':
        return 'Normal';
      case 'warning':
        return 'Warning';
      case 'critical':
        return 'Critical';
      default:
        return 'Unknown';
    }
  });

  readonly badgeClass = computed(() => {
    switch (this.status()) {
      case 'normal':
        return 'badge-normal';
      case 'warning':
        return 'badge-warning';
      case 'critical':
        return 'badge-critical';
      default:
        return 'badge-secondary';
    }
  });
}

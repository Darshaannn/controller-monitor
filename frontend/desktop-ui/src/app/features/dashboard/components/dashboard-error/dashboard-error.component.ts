import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-error',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-error.component.html',
  styleUrl: './dashboard-error.component.scss',
})
export class DashboardErrorComponent {
  readonly message = input<string>(
    'Unable to retrieve telemetry data. Check the local monitoring service and try again.',
  );
  readonly retry = output<void>();

  onRetry(): void {
    this.retry.emit();
  }
}

import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConnectionState } from '../../../core/models/dashboard-view.model';

@Component({
  selector: 'app-connection-indicator',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './connection-indicator.component.html',
  styleUrl: './connection-indicator.component.scss',
})
export class ConnectionIndicatorComponent {
  readonly state = input.required<ConnectionState>();
  readonly endpoint = input<string>('');

  readonly statusLabel = computed(() => {
    switch (this.state()) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'offline':
        return 'Offline';
      case 'error':
        return 'Connection Failed';
      default:
        return 'Disconnected';
    }
  });

  readonly statusClass = computed(() => {
    switch (this.state()) {
      case 'connected':
        return 'state-connected';
      case 'connecting':
        return 'state-connecting';
      case 'reconnecting':
        return 'state-reconnecting';
      case 'offline':
      case 'error':
        return 'state-error';
      default:
        return 'state-disconnected';
    }
  });
}

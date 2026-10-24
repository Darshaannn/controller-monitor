import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppHeaderComponent } from './shared/components/app-header/app-header.component';
import { DashboardPageComponent } from './features/dashboard/dashboard-page.component';
import { DashboardFacadeService } from './features/dashboard/services/dashboard-facade.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, AppHeaderComponent, DashboardPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class AppComponent implements OnInit {
  protected readonly facade = inject(DashboardFacadeService);

  ngOnInit(): void {
    this.facade.startPolling();
  }
}

import {
  Component,
  ElementRef,
  viewChild,
  input,
  computed,
  effect,
  signal,
  ChangeDetectionStrategy,
  OnDestroy,
  AfterViewInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartOptions, registerables } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import { ConvertedHistoryPoint } from '../../../core/models/dashboard-view.model';
import { MetricKey, MeasurementUnit } from 'telemetry-contracts';
import { ThemeService } from '../../../core/services/theme.service';

// Register Chart.js core components and zoom plugin once
Chart.register(...registerables, zoomPlugin);

@Component({
  selector: 'app-telemetry-chart',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './telemetry-chart.component.html',
  styleUrl: './telemetry-chart.component.scss',
})
export class TelemetryChartComponent implements AfterViewInit, OnDestroy {
  readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('chartCanvas');

  readonly metricKey = input.required<MetricKey>();
  readonly history = input.required<readonly ConvertedHistoryPoint[]>();
  readonly unit = input.required<MeasurementUnit>();
  readonly label = input<string>('Trend');

  private readonly themeService = inject(ThemeService);
  private chartInstance: Chart<'line'> | null = null;
  readonly isZoomed = signal<boolean>(false);

  private readonly themeColors = computed(() => {
    switch (this.metricKey()) {
      case 'velocity':
        // Crisp Emerald / Forest Green
        return { border: '#16a34a', background: 'rgba(22, 163, 74, 0.12)' };
      case 'pressure':
        // Vibrant Industrial Yellow / Amber
        return { border: '#eab308', background: 'rgba(234, 179, 8, 0.14)' };
      case 'temperature':
        // High-contrast Precision Red
        return { border: '#dc2626', background: 'rgba(220, 38, 38, 0.12)' };
      default:
        return { border: '#0f2b48', background: 'rgba(15, 43, 72, 0.1)' };
    }
  });

  constructor() {
    // Reactive incremental update effect: continuously renders rolling data points
    effect(() => {
      const data = this.history();
      const currentUnit = this.unit();
      if (!this.chartInstance) return;

      const labels = data.map((d) => d.time);
      const values = data.map((d) => d.value);

      this.chartInstance.data.labels = labels;
      if (this.chartInstance.data.datasets[0]) {
        this.chartInstance.data.datasets[0].data = values;
        this.chartInstance.data.datasets[0].label = `${this.label()} (${currentUnit})`;
      }

      const scales = this.chartInstance.options.scales;
      if (scales) {
        const yScale = scales['y'];
        if (yScale?.title) {
          yScale.title.text = currentUnit;
        }
      }

      this.chartInstance.update('none');
    });

    // Theme synchronization effect: updates Chart grid, tick, and tooltip colors seamlessly
    effect(() => {
      const theme = this.themeService.currentTheme();
      if (!this.chartInstance) return;

      const isDark = theme === 'dark';
      const gridColor = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(203, 213, 225, 0.6)';
      const textColor = isDark ? '#94a3b8' : '#475569';
      const tooltipBg = isDark ? '#0f172a' : '#ffffff';
      const tooltipTitle = isDark ? '#94a3b8' : '#475569';
      const tooltipBody = isDark ? '#f8fafc' : '#0f172a';
      const tooltipBorder = isDark ? '#334155' : '#cbd5e1';

      const scales = this.chartInstance.options.scales;
      if (scales) {
        const x = scales['x'];
        const y = scales['y'];
        if (x) {
          if (x.grid) x.grid.color = gridColor;
          if (x.ticks) x.ticks.color = textColor;
        }
        if (y) {
          if (y.grid) y.grid.color = gridColor;
          if (y.ticks) y.ticks.color = textColor;
        }
      }

      const tooltip = this.chartInstance.options.plugins?.tooltip;
      if (tooltip) {
        tooltip.backgroundColor = tooltipBg;
        tooltip.titleColor = tooltipTitle;
        tooltip.bodyColor = tooltipBody;
        tooltip.borderColor = tooltipBorder;
      }

      this.chartInstance.update('none');
    });
  }

  ngAfterViewInit(): void {
    this.initChart();
  }

  ngOnDestroy(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }

  private initChart(): void {
    const canvas = this.canvasRef().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = this.themeColors();
    const data = this.history();
    const labels = data.map((d) => d.time);
    const values = data.map((d) => d.value);
    const currentUnit = this.unit();

    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: `${this.label()} (${currentUnit})`,
            data: values,
            borderColor: colors.border,
            backgroundColor: colors.background,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: colors.border,
            pointHoverBorderColor: '#ffffff',
            tension: 0.3,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false, // High performance, zero flicker during 1-second continuous polling
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#94a3b8',
            bodyColor: '#f8fafc',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 8,
            displayColors: false,
            callbacks: {
              title: (items) => {
                const item = items[0];
                return item ? `Time: ${item.label}` : '';
              },
              label: (context) => {
                const val = context.parsed.y;
                return `${this.label()}: ${val} ${this.unit()}`;
              },
            },
          },
          zoom: {
            pan: {
              enabled: true,
              mode: 'x',
              onPanComplete: () => this.isZoomed.set(true),
            },
            zoom: {
              wheel: {
                enabled: true,
              },
              pinch: {
                enabled: true,
              },
              mode: 'x',
              onZoomComplete: () => this.isZoomed.set(true),
            },
          },
        },
        scales: {
          x: {
            display: true,
            grid: {
              color: 'rgba(15, 43, 72, 0.08)',
            },
            ticks: {
              color: '#475a72',
              font: { size: 10 },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 6,
            },
          },
          y: {
            display: true,
            grid: {
              color: 'rgba(15, 43, 72, 0.08)',
            },
            ticks: {
              color: '#475a72',
              font: { size: 10 },
              maxTicksLimit: 5,
            },
            title: {
              display: true,
              text: currentUnit,
              color: '#0b1a30',
              font: { size: 10, weight: 'bold' },
            },
          },
        },
      },
    });
  }

  zoomIn(): void {
    if (this.chartInstance) {
      this.chartInstance.zoom(1.2);
      this.isZoomed.set(true);
    }
  }

  zoomOut(): void {
    if (this.chartInstance) {
      this.chartInstance.zoom(0.8);
      this.isZoomed.set(true);
    }
  }

  resetZoom(): void {
    if (this.chartInstance) {
      this.chartInstance.resetZoom();
      this.isZoomed.set(false);
    }
  }
}

import { 
  Component, 
  Input, 
  ElementRef, 
  ViewChild, 
  AfterViewInit, 
  OnChanges, 
  OnDestroy, 
  SimpleChanges, 
  ChangeDetectionStrategy 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  Chart, 
  ChartType, 
  ChartConfiguration, 
  registerables 
} from 'chart.js';

// Registro global de los módulos de Chart.js
Chart.register(...registerables);

/**
 * Componente Reutilizable y Agnóstico para Renderizado de Gráficos (Chart.js)
 * Cumplimiento RA 3 y RA 5: Cuadro de Mando interactivo con ciclo de vida seguro (ngOnDestroy).
 */
@Component({
  selector: 'app-chart-widget',
  template: `
    <div class="chart-card" role="region" [attr.aria-label]="title">
      <header class="chart-header" *ngIf="title">
        <h4 class="chart-title">{{ title }}</h4>
        <span *ngIf="subtitle" class="chart-subtitle">{{ subtitle }}</span>
      </header>
      <div class="canvas-wrapper" [style.height.px]="height">
        <canvas #chartCanvas role="img" [attr.aria-label]="title + ' - Gráfico interactivo'"></canvas>
      </div>
    </div>
  `,
  styles: [`
    .chart-card {
      background: var(--ion-background-color, #ffffff);
      border: 1px solid var(--ion-color-step-150, #e2e8f0);
      border-radius: 12px;
      padding: 1.25rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      margin-bottom: 1.5rem;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .chart-header {
      margin-bottom: 1rem;

      .chart-title {
        font-size: 1.05rem;
        font-weight: 700;
        color: var(--ion-text-color, #0f172a);
        margin: 0 0 0.25rem 0;
      }

      .chart-subtitle {
        font-size: 0.8rem;
        color: var(--ion-color-step-500, #64748b);
      }
    }

    .canvas-wrapper {
      position: relative;
      width: 100%;
      flex: 1;
    }
  `],
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChartWidgetComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('chartCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input({ required: true }) type: ChartType = 'bar';
  @Input({ required: true }) labels: string[] = [];
  @Input({ required: true }) datasets: any[] = [];
  @Input() title: string = '';
  @Input() subtitle?: string;
  @Input() height: number = 280;

  private chartInstance: Chart | null = null;

  ngAfterViewInit(): void {
    this.createOrUpdateChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.chartInstance && (changes['labels'] || changes['datasets'] || changes['type'])) {
      this.createOrUpdateChart();
    }
  }

  /**
   * Limpieza de recursos y destrucción de la instancia para evitar memory leaks (RA 3)
   */
  ngOnDestroy(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }

  private createOrUpdateChart(): void {
    if (!this.canvasRef || !this.canvasRef.nativeElement) {
      return;
    }

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: this.type,
      data: {
        labels: this.labels,
        datasets: this.datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 14,
              font: { family: 'system-ui, -apple-system, sans-serif', size: 12 },
              color: '#475569'
            }
          },
          tooltip: {
            backgroundColor: '#1e293b',
            titleFont: { size: 13, weight: 'bold' },
            bodyFont: { size: 12 },
            padding: 10,
            cornerRadius: 6
          }
        },
        scales: this.type === 'doughnut' || this.type === 'pie' ? {} : {
          x: {
            grid: { display: false },
            ticks: { color: '#64748b', font: { size: 11 } }
          },
          y: {
            grid: { color: '#f1f5f9' },
            ticks: { color: '#64748b', font: { size: 11 } }
          }
        }
      }
    };

    this.chartInstance = new Chart(ctx, config);
  }
}


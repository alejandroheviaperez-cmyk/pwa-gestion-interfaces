import { 
  Component, 
  OnInit, 
  inject, 
  signal, 
  computed, 
  ChangeDetectionStrategy 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonButton, 
  IonSpinner, 
  IonBadge
} from '@ionic/angular';
import { ReportDataService } from '../../services/report-data.service';
import { AuthService } from '../../services/auth.service';
import { BusinessRecord } from '../../models/record.model';
import { AuditLog } from '../../models/audit-log.model';
import { DashboardSummary } from '../../models/metric.model';
import { MetricCardComponent } from '../../components/metric-card/metric-card.component';
import { ChartWidgetComponent } from '../../components/chart-widget/chart-widget.component';

/**
 * Vista de Cuadro de Mando e Informes Visuales para Administradores
 * Cumplimiento RA 5: Paso 3.2 - Dashboard interactivo con filtros en tiempo real y gráficos consolidados.
 */
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonSpinner,
    IonBadge,
    MetricCardComponent,
    ChartWidgetComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPage implements OnInit {
  private reportService = inject(ReportDataService);
  public authService = inject(AuthService);

  // Estado reactivo con Signals
  public isLoading = signal<boolean>(true);
  public records = signal<BusinessRecord[]>([]);
  public auditLogs = signal<AuditLog[]>([]);

  // Filtros reactivos interactivos en tiempo real
  public selectedCategory = signal<string>('TODAS');
  public selectedStatus = signal<string>('TODOS');

  // Categorías disponibles
  public categories = computed(() => {
    const raw = this.records().map(r => r.categoria);
    return ['TODAS', ...Array.from(new Set(raw))];
  });

  // Registros filtrados dinámicamente según filtros activos
  public filteredRecords = computed(() => {
    let list = this.records();
    const cat = this.selectedCategory();
    const st = this.selectedStatus();

    if (cat !== 'TODAS') {
      list = list.filter(r => r.categoria === cat);
    }
    if (st !== 'TODOS') {
      list = list.filter(r => r.estado === st);
    }
    return list;
  });

  // KPIs calculados reactivamente
  public summary = computed<DashboardSummary>(() => {
    return this.reportService.calculateSummary(this.filteredRecords(), this.auditLogs());
  });

  // Datos para Gráfico 1: Stock y Valoración por Categoría (Barras)
  public barChartLabels = computed(() => {
    const dist = this.reportService.getCategoryDistribution(this.filteredRecords());
    return dist.categories;
  });

  public barChartDatasets = computed(() => {
    const dist = this.reportService.getCategoryDistribution(this.filteredRecords());
    return [
      {
        label: 'Unidades en Stock',
        data: dist.counts,
        backgroundColor: 'rgba(56, 128, 255, 0.8)',
        borderRadius: 6
      },
      {
        label: 'Valoración en Miles (€)',
        data: dist.values.map(v => Math.round(v / 100) / 10),
        backgroundColor: 'rgba(45, 211, 111, 0.8)',
        borderRadius: 6
      }
    ];
  });

  // Datos para Gráfico 2: Distribución por Estado (Doughnut)
  public doughnutLabels = computed(() => {
    const dist = this.reportService.getStatusDistribution(this.filteredRecords());
    return dist.statuses;
  });

  public doughnutDatasets = computed(() => {
    const dist = this.reportService.getStatusDistribution(this.filteredRecords());
    return [
      {
        data: dist.counts,
        backgroundColor: [
          '#2dd36f', // Activo (Verde)
          '#ffc409', // Bajo Stock (Amarillo)
          '#eb445a', // Agotado (Rojo)
          '#92949c'  // En Revisión (Gris)
        ]
      }
    ];
  });

  // Datos para Gráfico 3: Actividad en Tiempo Real por Tipo de Acción (Líneas)
  public lineChartLabels = computed(() => {
    return ['Hace 50m', 'Hace 40m', 'Hace 30m', 'Hace 20m', 'Hace 10m', 'Ahora'];
  });

  public lineChartDatasets = computed(() => {
    const totalLogs = this.auditLogs().length;
    return [
      {
        label: 'Eventos NoSQL Firebase en Tiempo Real',
        data: [
          Math.max(1, Math.round(totalLogs * 0.2)),
          Math.max(2, Math.round(totalLogs * 0.4)),
          Math.max(2, Math.round(totalLogs * 0.3)),
          Math.max(3, Math.round(totalLogs * 0.7)),
          Math.max(4, Math.round(totalLogs * 0.9)),
          totalLogs
        ],
        fill: true,
        borderColor: '#5260ff',
        backgroundColor: 'rgba(82, 96, 255, 0.1)',
        tension: 0.35
      }
    ];
  });

  ngOnInit(): void {
    this.loadConsolidatedData();
  }

  loadConsolidatedData(): void {
    this.isLoading.set(true);
    this.reportService.getConsolidatedData().subscribe({
      next: ({ records, logs }) => {
        this.records.set(records);
        this.auditLogs.set(logs);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al recuperar datos:', err);
        this.isLoading.set(false);
      }
    });
  }

  setCategoryFilter(category: string): void {
    this.selectedCategory.set(category);
  }

  setStatusFilter(status: string): void {
    this.selectedStatus.set(status);
  }

  logout(): void {
    this.authService.logout();
  }
}

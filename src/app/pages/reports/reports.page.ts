import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonSpinner 
} from '@ionic/angular';
import { ReportDataService } from '../../services/report-data.service';
import { ExportService } from '../../services/export.service';
import { AuthService } from '../../services/auth.service';
import { BusinessRecord } from '../../models/record.model';
import { DashboardSummary } from '../../models/metric.model';

/**
 * Vista de Generación y Descarga de Informes Oficiales (PDF & CSV)
 * Cumplimiento RA 5: Paso 3.3 - Exportación de datos tabulados del sistema en formatos estándar.
 */
@Component({
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonSpinner
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsPage implements OnInit {
  private reportService = inject(ReportDataService);
  private exportService = inject(ExportService);
  public authService = inject(AuthService);

  public isLoading = signal<boolean>(true);
  public isExportingPdf = signal<boolean>(false);
  public isExportingCsv = signal<boolean>(false);
  public records = signal<BusinessRecord[]>([]);
  public summary = signal<DashboardSummary>({
    totalRegistros: 0,
    stockTotal: 0,
    valorTotalInventario: 0,
    registrosActivos: 0,
    registrosBajoStock: 0,
    logsEnTiempoReal: 0
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.reportService.getConsolidatedData().subscribe({
      next: ({ records, summary }) => {
        this.records.set(records);
        this.summary.set(summary);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  async downloadPdf(): Promise<void> {
    this.isExportingPdf.set(true);
    try {
      await this.exportService.exportToPdf(this.records(), this.summary());
    } catch (e) {
      console.error('Error al generar PDF:', e);
    } finally {
      this.isExportingPdf.set(false);
    }
  }

  async downloadCsv(): Promise<void> {
    this.isExportingCsv.set(true);
    try {
      await this.exportService.exportToCsv(this.records());
    } catch (e) {
      console.error('Error al generar CSV:', e);
    } finally {
      this.isExportingCsv.set(false);
    }
  }
}

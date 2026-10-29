import { Injectable, inject } from '@angular/core';
import { jsPDF } from 'jspdf';
import { BusinessRecord } from '../models/record.model';
import { DashboardSummary } from '../models/metric.model';
import { FirebaseService } from './firebase.service';
import { AuthService } from './auth.service';

/**
 * Servicio de Generación y Descarga de Informes en Formatos Estándar (PDF y CSV)
 * Cumplimiento RA 5: Paso 3.3 - Exportación de datos tabulados del sistema.
 */
@Injectable({
  providedIn: 'root'
})
export class ExportService {
  private firebaseService = inject(FirebaseService);
  private authService = inject(AuthService);

  /**
   * Exporta la colección de datos a formato CSV estándar con codificación UTF-8
   * @param records Lista de registros empresariales
   * @param filename Nombre del fichero sin extensión
   */
  async exportToCsv(records: BusinessRecord[], filename: string = 'informe_inventario'): Promise<void> {
    const headers = ['ID', 'Código', 'Nombre', 'Categoría', 'Precio (€)', 'Stock', 'Estado', 'Fecha Creación'];
    
    const rows = records.map(r => [
      `"${r.id}"`,
      `"${r.codigo}"`,
      `"${r.nombre.replace(/"/g, '""')}"`,
      `"${r.categoria}"`,
      r.precio.toFixed(2),
      r.stock,
      `"${r.estado}"`,
      `"${r.fechaCreacion}"`
    ]);

    const csvContent = '\uFEFF' + [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${this.getTimestampSuffix()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Auditoría en Firebase Firestore
    const user = this.authService.getSnapshot().user;
    await this.firebaseService.logAction({
      accion: 'EXPORTAR_CSV',
      entidad: 'Informes',
      usuario: user ? user.email : 'anónimo',
      rol: user ? user.rol : 'Standard',
      detalles: `Descarga de informe CSV con ${records.length} registros.`
    });
  }

  /**
   * Genera un informe profesional tabulado en PDF empleando jsPDF
   * @param records Lista de registros empresariales
   * @param summary Resumen de métricas consolidadas
   * @param filename Nombre del fichero PDF
   */
  async exportToPdf(records: BusinessRecord[], summary: DashboardSummary, filename: string = 'informe_corporativo'): Promise<void> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const user = this.authService.getSnapshot().user;
    const now = new Date().toLocaleString('es-ES');

    // Encabezado Corporativo
    doc.setFillColor(30, 41, 59); // Slate oscuro corporativo
    doc.rect(0, 0, 210, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('SISTEMA DE GESTIÓN MULTIPLATAFORMA', 14, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('MÓDULO DESARROLLO DE INTERFACES (0488) | DAM', 14, 22);

    // Metadatos del informe
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9);
    doc.text(`Fecha de emisión: ${now}`, 14, 38);
    doc.text(`Generado por: ${user?.nombre || 'Usuario'} (${user?.rol || 'Estándar'})`, 14, 43);
    doc.text(`Entorno: Producción Híbrida / PWA`, 14, 48);

    // Resumen Ejecutivo (KPI Box)
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 52, 182, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('RESUMEN EJECUTIVO CONSOLIDADO (SQL & NoSQL)', 18, 58);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Total Activos: ${summary.totalRegistros}`, 18, 64);
    doc.text(`Stock Total: ${summary.stockTotal} uds.`, 65, 64);
    doc.text(`Valoración: €${summary.valorTotalInventario.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 115, 64);
    doc.text(`Bajo Stock: ${summary.registrosBajoStock}`, 165, 64);
    doc.text(`Logs en Tiempo Real: ${summary.logsEnTiempoReal}`, 18, 70);

    // Tabla de Registros
    let startY = 82;
    doc.setFillColor(59, 130, 246);
    doc.rect(14, startY, 182, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);

    doc.text('Código', 16, startY + 5.5);
    doc.text('Descripción / Nombre', 42, startY + 5.5);
    doc.text('Categoría', 105, startY + 5.5);
    doc.text('Precio', 138, startY + 5.5);
    doc.text('Stock', 160, startY + 5.5);
    doc.text('Estado', 178, startY + 5.5);

    startY += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    records.forEach((rec, idx) => {
      // Paginación si excede el tamaño
      if (startY > 270) {
        doc.addPage();
        startY = 20;
      }

      // Alternar color de fondo de filas
      if (idx % 2 === 0) {
        doc.setFillColor(241, 245, 249);
        doc.rect(14, startY, 182, 7, 'F');
      }

      doc.text(rec.codigo, 16, startY + 5);
      const truncatedName = rec.nombre.length > 35 ? rec.nombre.substring(0, 32) + '...' : rec.nombre;
      doc.text(truncatedName, 42, startY + 5);
      doc.text(rec.categoria, 105, startY + 5);
      doc.text(`€${rec.precio.toFixed(2)}`, 138, startY + 5);
      doc.text(rec.stock.toString(), 162, startY + 5);
      doc.text(rec.estado, 178, startY + 5);

      startY += 7;
    });

    // Pie de página con numeración
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Página ${i} de ${pageCount} - Documento Oficial generado automáticamente - Certificación WCAG & PWA`,
        14,
        290
      );
    }

    doc.save(`${filename}_${this.getTimestampSuffix()}.pdf`);

    // Auditoría en Firebase Firestore
    await this.firebaseService.logAction({
      accion: 'EXPORTAR_PDF',
      entidad: 'Informes',
      usuario: user ? user.email : 'anónimo',
      rol: user ? user.rol : 'Standard',
      detalles: `Descarga de informe corporativo tabulado PDF (${records.length} registros).`
    });
  }

  private getTimestampSuffix(): string {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
  }
}


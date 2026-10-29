import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, from, of } from 'rxjs';
import { map, catchError, take } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { FirebaseService } from './firebase.service';
import { BusinessRecord } from '../models/record.model';
import { AuditLog } from '../models/audit-log.model';
import { DashboardSummary } from '../models/metric.model';

/**
 * Servicio de Consolidación y Orquestación Asíncrona Concurrente (Dual SQL / NoSQL)
 * Cumplimiento RA 5: Orquestación asíncrona avanzada (RxJS forkJoin / Promise.all) y Cuadro de Mando.
 */
@Injectable({
  providedIn: 'root'
})
export class ReportDataService {
  private supabaseService = inject(SupabaseService);
  private firebaseService = inject(FirebaseService);

  /**
   * Ejecuta consulta concurrente a las dos fuentes de persistencia:
   * 1. Supabase (SQL - Registros de inventario y activos)
   * 2. Firebase Firestore (NoSQL - Logs de auditoría en tiempo real)
   * Utiliza forkJoin de RxJS para resolver ambas peticiones en paralelo.
   */
  getConsolidatedData(): Observable<{ records: BusinessRecord[]; logs: AuditLog[]; summary: DashboardSummary }> {
    const records$ = from(this.supabaseService.getRecords()).pipe(
      catchError(err => {
        console.warn('Error recuperando SQL, usando fallback:', err);
        return of(this.supabaseService.getLocalRecords());
      })
    );

    const logs$ = this.firebaseService.getRealtimeAuditLogs(30).pipe(
      take(1),
      catchError(err => {
        console.warn('Error recuperando NoSQL, usando fallback:', err);
        return of([]);
      })
    );

    return forkJoin({
      records: records$,
      logs: logs$
    }).pipe(
      map(({ records, logs }) => {
        const summary = this.calculateSummary(records, logs);
        return { records, logs, summary };
      })
    );
  }

  /**
   * Calcula los indicadores clave de rendimiento (KPIs) a partir de los datos consolidados
   */
  public calculateSummary(records: BusinessRecord[], logs: AuditLog[]): DashboardSummary {
    const totalRegistros = records.length;
    const stockTotal = records.reduce((acc, curr) => acc + (curr.stock || 0), 0);
    const valorTotalInventario = records.reduce((acc, curr) => acc + ((curr.precio || 0) * (curr.stock || 0)), 0);
    const registrosActivos = records.filter(r => r.estado === 'Activo').length;
    const registrosBajoStock = records.filter(r => r.estado === 'Bajo Stock' || r.stock < 5).length;
    const logsEnTiempoReal = logs.length;

    return {
      totalRegistros,
      stockTotal,
      valorTotalInventario,
      registrosActivos,
      registrosBajoStock,
      logsEnTiempoReal
    };
  }

  /**
   * Agrupa los registros por categoría para visualización en gráficos de Chart.js
   */
  getCategoryDistribution(records: BusinessRecord[]): { categories: string[]; counts: number[]; values: number[] } {
    const mapCount = new Map<string, number>();
    const mapVal = new Map<string, number>();

    records.forEach(r => {
      const cat = r.categoria || 'Sin Categoría';
      mapCount.set(cat, (mapCount.get(cat) || 0) + 1);
      mapVal.set(cat, (mapVal.get(cat) || 0) + (r.precio * r.stock));
    });

    const categories = Array.from(mapCount.keys());
    const counts = categories.map(c => mapCount.get(c) || 0);
    const values = categories.map(c => Number((mapVal.get(c) || 0).toFixed(2)));

    return { categories, counts, values };
  }

  /**
   * Distribución por estado de inventario
   */
  getStatusDistribution(records: BusinessRecord[]): { statuses: string[]; counts: number[] } {
    const statuses = ['Activo', 'Bajo Stock', 'Agotado', 'En Revisión'];
    const counts = statuses.map(s => records.filter(r => r.estado === s).length);
    return { statuses, counts };
  }
}

/**
 * Modelo de Métricas y Datos Agregados para el Cuadro de Mando
 * Cumplimiento RA 5: Representación visual y consolidada de métricas.
 */

export interface DashboardSummary {
  totalRegistros: number;
  stockTotal: number;
  valorTotalInventario: number;
  registrosActivos: number;
  registrosBajoStock: number;
  logsEnTiempoReal: number;
}

export interface MetricChartData {
  labels: string[];
  data: number[];
  backgroundColor?: string[];
  borderColor?: string;
}


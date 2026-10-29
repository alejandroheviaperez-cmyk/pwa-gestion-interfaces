/**
 * Modelo de Entidad de Negocio para Persistencia SQL (Supabase)
 * Cumplimiento RA 5: Consumo asíncrono de orígenes de datos relacionales.
 */

export type RecordStatus = 'Activo' | 'Bajo Stock' | 'Agotado' | 'En Revisión';

export interface BusinessRecord {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  estado: RecordStatus;
  fechaCreacion: string;
  descripcion?: string;
}

export interface TableColumn {
  key: keyof BusinessRecord | string;
  header: string;
  sortable?: boolean;
  type?: 'text' | 'number' | 'currency' | 'status' | 'date';
}


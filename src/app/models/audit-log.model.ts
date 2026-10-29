/**
 * Modelo de Registro de Auditoría y Eventos en Tiempo Real (Firebase Firestore - NoSQL)
 * Cumplimiento RA 5: Consumo en tiempo real de base de datos basada en documentos.
 */

import { UserRole } from './user.model';

export type AuditAction = 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'CREAR_REGISTRO' 
  | 'EDITAR_REGISTRO' 
  | 'ELIMINAR_REGISTRO' 
  | 'EXPORTAR_PDF' 
  | 'EXPORTAR_CSV' 
  | 'FILTRADO_DASHBOARD';

export interface AuditLog {
  id?: string;
  accion: AuditAction;
  entidad: string;
  usuario: string;
  rol: UserRole;
  timestamp: string;
  detalles: string;
}

/**
 * Modelos de Usuario y Autenticación
 * Cumplimiento RA 1: Control de acceso basado en roles (Admin y Standard).
 */

export type UserRole = 'Admin' | 'Standard';

export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: UserRole;
  departamento?: string;
  avatarUrl?: string;
  token?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  role: UserRole | null;
  token: string | null;
}

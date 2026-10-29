import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard de Protección Específica para Rol Administrador
 * Cumplimiento RA 1: Control de acceso basado en dos roles definidos (Admin y Estándar).
 */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const snapshot = authService.getSnapshot();

  if (snapshot.isAuthenticated && snapshot.role === 'Admin') {
    return true;
  }

  // Si es un usuario estándar, redirige a su área permitida (inventario)
  return router.createUrlTree(['/tabs/inventory']);
};

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard de Protección de Rutas Autenticadas
 * Cumplimiento RA 1: Protección de rutas (Guards / Private Routes)
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.getSnapshot().isAuthenticated) {
    return true;
  }

  // Redirección declarativa al Login
  return router.createUrlTree(['/login']);
};

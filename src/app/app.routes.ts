import type { Routes } from '@angular/router';

/**
 * Enrutamiento Principal de la Aplicación
 * Cumplimiento RA 1: Configuración de rutas raíz con Lazy Loading.
 */
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage)
  },
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then(m => m.routes)
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];

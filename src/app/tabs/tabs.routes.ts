import type { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { authGuard } from '../guards/auth.guard';
import { adminGuard } from '../guards/admin.guard';

/**
 * Enrutamiento con Carga Diferida (Lazy Loading) y Protección de Rutas (Guards)
 * Cumplimiento RA 1: Paso 1.1 - Sistema de Enrutamiento y Navegación con dos roles definidos.
 */
export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('../pages/dashboard/dashboard.page').then(m => m.DashboardPage),
        canActivate: [adminGuard]
      },
      {
        path: 'inventory',
        loadComponent: () => import('../pages/inventory/inventory.page').then(m => m.InventoryPage)
      },
      {
        path: 'realtime',
        loadComponent: () => import('../pages/realtime/realtime.page').then(m => m.RealtimePage)
      },
      {
        path: 'reports',
        loadComponent: () => import('../pages/reports/reports.page').then(m => m.ReportsPage),
        canActivate: [adminGuard]
      },
      {
        path: 'help',
        loadComponent: () => import('../pages/help/help.page').then(m => m.HelpPage)
      },
      {
        path: '',
        redirectTo: '/tabs/inventory',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/tabs/inventory',
    pathMatch: 'full'
  }
];

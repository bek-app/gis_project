import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/map-page/map-page.component').then(m => m.MapPageComponent),
  },
  {
    path: 'admin/login',
    loadComponent: () => import('./admin/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin/panel/admin-panel.component').then(m => m.AdminPanelComponent),
    canActivate: [adminGuard],
  },
  { path: '**', redirectTo: '' },
];

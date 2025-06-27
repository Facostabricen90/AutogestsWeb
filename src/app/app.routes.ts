import { Routes } from '@angular/router';
import { authGuard } from './auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then(m => m.authRoutes),
  },
  {
    path: '',
    loadChildren: () => import('./store/store.routes').then(m => m.storeRoutes),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '',
  }
];

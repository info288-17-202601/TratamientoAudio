import { Routes } from '@angular/router';

import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login').then((m) => m.LoginComponent),
    title: 'Iniciar sesion - Sound Colab',
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register').then((m) => m.RegisterComponent),
    title: 'Crear cuenta - Sound Colab',
  },
  {
    path: '',
    canMatch: [authGuard],
    loadComponent: () =>
      import('./pages/shell/shell').then((m) => m.ShellComponent),
    title: 'Sound Colab - Mapa de ruido',
  },
  { path: '**', redirectTo: '' },
];

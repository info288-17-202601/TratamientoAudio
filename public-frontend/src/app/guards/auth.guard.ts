import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlTree } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Bloquea el acceso a una ruta si el usuario no está autenticado.
 * Si no hay token, redirige a /login conservando la URL original como
 * query param `returnUrl`.
 */
export const authGuard: CanMatchFn = (_route, segments): boolean | UrlTree => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  const returnUrl = '/' + segments.map((s) => s.path).join('/');
  return router.createUrlTree(['/login'], { queryParams: { returnUrl } });
};

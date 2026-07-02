import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

/**
 * Adjunta `Authorization: Bearer <token>` a todas las requests salientes
 * (excepto a las del propio endpoint de auth, que no lo requieren).
 *
 * Si el backend responde 401 en cualquier llamada, limpia la sesión y
 * redirige a /login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.getToken();

  const isAuthEndpoint = /\/api\/auth\//.test(req.url);
  const authReq =
    token && !isAuthEndpoint
      ? req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        })
      : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !isAuthEndpoint) {
        // Limpia el token y manda al login.
        try {
          localStorage.removeItem('public-frontend:token');
          localStorage.removeItem('public-frontend:user');
          localStorage.removeItem('public-frontend:expires_at');
        } catch {
          // ignore
        }
        router.navigateByUrl('/login');
      }
      return throwError(() => error);
    }),
  );
};

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = isBrowser() ? localStorage.getItem('access_token') : null;

  let request = req;
  if (token) {
    request = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // Evitamos redirección infinita o errónea si ya estamos en login
      const isAuthRequest = req.url.includes('/auth/login') || req.url.includes('/auth/register');

      // Si el servidor responde 401 (No autorizado) es porque el token ya no es válido
      // o la sesión fue invalidada desde el panel de administración.
      // IMPORTANTE: Solo redirigir si NO es una petición de autenticación fallida.
      if (error.status === 401 && !isAuthRequest) {
        if (isBrowser()) {
          localStorage.clear();
          router.navigate(['/login'], { queryParams: { expired: 'true' } });
        }
      }
      return throwError(() => error);
    })
  );
};

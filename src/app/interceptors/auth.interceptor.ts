import { HttpInterceptorFn } from '@angular/common/http';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = isBrowser() ? localStorage.getItem('access_token') : null;

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(cloned);
  }

  return next(req);
};

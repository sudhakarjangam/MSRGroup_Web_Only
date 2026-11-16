import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const isApi = req.url.startsWith(environment.apiBaseUrl);
  const token = auth.token;
  const outgoing = isApi ? req.clone({
    ...(token ? { setHeaders: { Authorization: `Bearer ${token}` } } : {}),
    withCredentials: true
  }) : req;

  return next(outgoing).pipe(catchError(error => {
    const isAuthRequest = req.url.includes('/api/auth/');
    if (!isApi || error.status !== 401 || isAuthRequest || !token) return throwError(() => error);

    return auth.refresh().pipe(
      switchMap(response => next(req.clone({
        setHeaders: { Authorization: `Bearer ${response.accessToken}` },
        withCredentials: true
      }))),
      catchError(() => throwError(() => error))
    );
  }));
};

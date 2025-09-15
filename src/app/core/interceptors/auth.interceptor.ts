import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Rutas que no requieren autenticación (públicas)
    const publicRoutes = [
      '/api/auth/send-reset-code',
      '/api/auth/verify-reset-code',
      '/api/auth/reset-password',
      '/api/auth/login',
      '/api/auth/linkedin'
    ];

    // Rutas que requieren autenticación pero no deben causar redirección en caso de error
    const protectedButNoRedirectRoutes = [
      '/api/users/verificar-perfil-completo',
      '/api/auth/renew'
    ];

    // Verificar si la ruta actual es pública
    const isPublicRoute = publicRoutes.some(route => request.url.includes(route));

    // Obtener el token del sessionStorage solo si no es una ruta pública
    const token = !isPublicRoute ? sessionStorage.getItem('token') : null;

    if (token) {
      // Preparar headers
      const headers: { [key: string]: string } = {
        'token': token
      };

      // Solo agregar Content-Type para métodos que tienen body
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        headers['Content-Type'] = 'application/json';
      }

      // Clonar la petición y agregar los headers
      request = request.clone({
        setHeaders: headers
      });
      // console.log('Interceptor - Headers agregados:', Object.keys(headers));
    }

    // Continuar con la petición
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {

        // Verificar si es una ruta protegida que no debe causar redirección
        const isProtectedNoRedirect = protectedButNoRedirectRoutes.some(route => request.url.includes(route));

        // Si el error es 401 (Unauthorized) y NO es una ruta pública ni protegida sin redirección, redirigir al login
        if (error.status === 401 && !isPublicRoute && !isProtectedNoRedirect) {
          console.error('Token expirado o inválido. Redirigiendo al login...');
          sessionStorage.removeItem('token');
          this.router.navigate(['/auth/login']);
        }

        return throwError(() => error);
      })
    );
  }
}

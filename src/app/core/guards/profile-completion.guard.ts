import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of, timer } from 'rxjs';
import { map, catchError, timeout, take } from 'rxjs/operators';
import { AuthService } from '../services/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileCompletionGuard implements CanActivate {

  private lastCheckTime = 0;
  private lastCheckResult: boolean | null = null;
  private readonly CACHE_DURATION = 5000; // 5 segundos de cache

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    // Verificar si hay token antes de hacer la verificación
    const token = sessionStorage.getItem('token');
    if (!token) {
      console.warn('ProfileCompletionGuard: No hay token, permitiendo acceso');
      return of(true);
    }

    // Si ya estamos en la página de perfil, permitir acceso para evitar bucle
    if (state.url.includes('/user/mi-perfil')) {
      return of(true);
    }

    // Usar cache para evitar verificaciones repetidas
    const now = Date.now();
    if (this.lastCheckResult !== null && (now - this.lastCheckTime) < this.CACHE_DURATION) {
      console.log('ProfileCompletionGuard: Usando resultado en cache:', this.lastCheckResult);
      return of(this.lastCheckResult);
    }

    console.log('ProfileCompletionGuard: Verificando perfil completo...');
    
    return this.authService.verificarPerfilCompleto().pipe(
      timeout(3000), // Timeout de 3 segundos
      take(1), // Solo tomar el primer resultado
      map(response => {
        this.lastCheckTime = now;
        
        if (response.ok && response.perfil_completo) {
          this.lastCheckResult = true;
          console.log('ProfileCompletionGuard: Perfil completo');
          return true;
        } else {
          this.lastCheckResult = false;
          console.log('ProfileCompletionGuard: Perfil incompleto, redirigiendo...');
          
          // Usar setTimeout para evitar problemas con el router
          setTimeout(() => {
            this.router.navigate(['/user/mi-perfil'], { 
              queryParams: { 
                completar: 'true',
                mensaje: 'Completa tu perfil para acceder al dashboard' 
              } 
            });
          }, 100);
          
          return false;
        }
      }),
      catchError(error => {
        console.error('ProfileCompletionGuard: Error verificando perfil:', error);
        this.lastCheckTime = now;
        this.lastCheckResult = true; // En caso de error, permitir acceso
        return of(true);
      })
    );
  }

  // Método para limpiar el cache (útil después de actualizar el perfil)
  clearCache(): void {
    this.lastCheckTime = 0;
    this.lastCheckResult = null;
  }
}

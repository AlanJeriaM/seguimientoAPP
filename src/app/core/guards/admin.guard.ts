import { Injectable } from '@angular/core';
import { CanActivate, CanMatch, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate, CanMatch {

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  private checkAdminAccess(): Observable<boolean> {
    return this.authService.validarToken().pipe(
      map(valid => {
        if (valid && this.authService.usuario.rol === 'ADMIN-USER') {
          return true;
        }
        this.router.navigate(['/auth']);
        return false;
      })
    );
  }

  canActivate(): Observable<boolean> | boolean {
    return this.checkAdminAccess();
  }

  canMatch(): Observable<boolean> | boolean {
    return this.checkAdminAccess();
  }

}

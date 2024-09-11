import { Injectable } from '@angular/core';
import { CanActivate, CanMatch, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ClientGuard implements CanActivate, CanMatch {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  private checkClientAccess(): Observable<boolean> {
    return this.authService.validarToken().pipe(
      map(valid => {
        if (valid && this.authService.usuario.rol === 'CLIENT-USER') {
          return true;
        }
        this.router.navigate(['/auth']);
        return false;
      })
    );
  }


  canActivate(): Observable<boolean> | boolean {
    return this.checkClientAccess();
  }

  canMatch(): Observable<boolean> | boolean {
    return this.checkClientAccess();
  }

}

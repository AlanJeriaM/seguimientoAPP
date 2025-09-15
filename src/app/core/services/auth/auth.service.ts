import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private url: string = environment.baseUrl;
  private _usuario!: any;

  get usuario() {
    return { ...this._usuario };
  }

  constructor(private http: HttpClient) { }

  // Login de administrador
  login(login: any): Observable<any> {
    return this.http.post<any>(`${this.url}/api/auth/login`, login)
      .pipe(
        tap(resp => {
          if (resp.ok) {
            sessionStorage.setItem('token', resp.token);
            this._usuario = {
              nombreUsuario: resp.nombreUsuario!,
              id: resp.id!,
              rol: resp.rol!,
            }
          }
        }),
        map(valido => valido.ok),
        catchError(err => of(err.error.msj)),
      )
  }

  // Obtener URL de autorización de LinkedIn
  getLinkedInAuthUrl(): Observable<any> {
    return this.http.get<any>(`${this.url}/api/auth/linkedin/auth-url`)
      .pipe(
        catchError(err => of({ ok: false, msj: err.error?.msj || 'Error al obtener URL de LinkedIn' }))
      );
  }

  // Procesar callback de LinkedIn
  processLinkedInCallback(code: string, state: string): Observable<any> {
    return this.http.get<any>(`${this.url}/api/auth/linkedin/callback?code=${code}&state=${state}`)
      .pipe(
        tap(resp => {
          if (resp.ok) {
            sessionStorage.setItem('token', resp.token);
            this._usuario = {
              nombreUsuario: resp.nombreUsuario!,
              id: resp.id!,
              rol: resp.rol!,
            }
          }
        }),
        map(valido => valido.ok),
        catchError(err => of(err.error.msj)),
      );
  }

  // Login con LinkedIn (simulado para desarrollo)
  loginLinkedIn(linkedinData: any): Observable<any> {
    return this.http.post<any>(`${this.url}/api/auth/linkedin`, { linkedinData })
      .pipe(
        tap(resp => {
          if (resp.ok) {
            sessionStorage.setItem('token', resp.token);
            this._usuario = {
              nombreUsuario: resp.nombreUsuario!,
              id: resp.id!,
              rol: resp.rol!,
            }
          }
        }),
        map(valido => valido.ok),
        catchError(err => of(err.error.msj)),
      )
  }

  // Validar token
  validarToken() {
    const headers = new HttpHeaders()
      .set('token', sessionStorage.getItem('token') || '');

    return this.http.get<any>(`${this.url}/api/auth/renew`, { headers })
      .pipe(
        map(resp => {
          sessionStorage.setItem('token', resp.token)
          this._usuario = {
            nombreUsuario: resp.nombreUsuario!,
            id: resp.id!,
            rol: resp.rol!,
          }
          return resp.ok;
        }),
        catchError(err => of(false)),
      )
  }

  // Obtener usuarios (para admin)
  obtenerUsuarios(page: number = 1, limit: number = 10, search: string = ''): Observable<any> {
    const headers = new HttpHeaders()
      .set('token', sessionStorage.getItem('token') || '');

    const params = `?page=${page}&limit=${limit}&search=${search}`;

    return this.http.get<any>(`${this.url}/api/users${params}`, { headers })
      .pipe(
        catchError(err => of({ ok: false, msj: err.error?.msj || 'Error al obtener usuarios' }))
      );
  }

  // Obtener mi perfil (para usuario)
  obtenerMiPerfil(): Observable<any> {
    const headers = new HttpHeaders()
      .set('token', sessionStorage.getItem('token') || '');

    return this.http.get<any>(`${this.url}/api/users/mi-perfil`, { headers })
      .pipe(
        catchError(err => of({ ok: false, msj: err.error?.msj || 'Error al obtener perfil' }))
      );
  }

  // Verificar si el perfil está completo
  verificarPerfilCompleto(): Observable<any> {
    const headers = new HttpHeaders()
      .set('token', sessionStorage.getItem('token') || '');

    return this.http.get<any>(`${this.url}/api/users/verificar-perfil-completo`, { headers })
      .pipe(
        catchError(err => of({ ok: false, perfil_completo: false, msj: err.error?.msj || 'Error al verificar perfil' }))
      );
  }

  // Actualizar mi perfil (para usuario)
  actualizarMiPerfil(datosActualizados: any): Observable<any> {
    const headers = new HttpHeaders()
      .set('token', sessionStorage.getItem('token') || '');

    return this.http.put<any>(`${this.url}/api/users/mi-perfil`, datosActualizados, { headers })
      .pipe(
        catchError(err => of({ ok: false, msj: err.error?.msj || 'Error al actualizar perfil' }))
      );
  }

  // Desactivar usuario (para admin)
  desactivarUsuario(id: number): Observable<any> {
    const headers = new HttpHeaders()
      .set('token', sessionStorage.getItem('token') || '');

    return this.http.delete<any>(`${this.url}/api/users/${id}`, { headers })
      .pipe(
        catchError(err => of({ ok: false, msj: err.error?.msj || 'Error al desactivar usuario' }))
      );
  }

  // Actualizar usuario (para admin)
  actualizarUsuario(id: number, datosActualizados: any): Observable<any> {
    const headers = new HttpHeaders()
      .set('token', sessionStorage.getItem('token') || '');

    return this.http.put<any>(`${this.url}/api/users/${id}`, datosActualizados, { headers })
      .pipe(
        catchError(err => of({ ok: false, msj: err.error?.msj || 'Error al actualizar usuario' }))
      );
  }

  // Obtener usuarios eliminados (para admin)
  obtenerUsuariosEliminados(page: number = 1, limit: number = 10, search: string = ''): Observable<any> {
    const headers = new HttpHeaders()
      .set('token', sessionStorage.getItem('token') || '');

    const params = `?page=${page}&limit=${limit}&search=${search}`;

    return this.http.get<any>(`${this.url}/api/users/eliminados${params}`, { headers })
      .pipe(
        catchError(err => of({ ok: false, msj: err.error?.msj || 'Error al obtener usuarios eliminados' }))
      );
  }

  // Reactivar usuario (para admin)
  reactivarUsuario(id: number): Observable<any> {
    const headers = new HttpHeaders()
      .set('token', sessionStorage.getItem('token') || '');

    return this.http.put<any>(`${this.url}/api/users/reactivar/${id}`, {}, { headers })
      .pipe(
        catchError(err => of({ ok: false, msj: err.error?.msj || 'Error al reactivar usuario' }))
      );
  }

  // Eliminar usuario permanentemente (para admin)
  eliminarUsuarioPermanentemente(id: number): Observable<any> {
    const headers = new HttpHeaders()
      .set('token', sessionStorage.getItem('token') || '');

    return this.http.delete<any>(`${this.url}/api/users/eliminar-permanente/${id}`, { headers })
      .pipe(
        catchError(err => of({ ok: false, msj: err.error?.msj || 'Error al eliminar usuario permanentemente' }))
      );
  }

  // Enviar código de restablecimiento de contraseña
  sendResetCode(email: string): Observable<any> {
    return this.http.post<any>(`${this.url}/api/auth/send-reset-code`, { email })
      .pipe(
        catchError(err => of({ ok: false, msj: err.error?.msj || 'Error al enviar código de restablecimiento' }))
      );
  }

  // Verificar código de restablecimiento
  verifyResetCode(email: string, code: string): Observable<any> {
    return this.http.post<any>(`${this.url}/api/auth/verify-reset-code`, { email, code })
      .pipe(
        catchError(err => of({ ok: false, msj: err.error?.msj || 'Error al verificar código' }))
      );
  }

  // Restablecer contraseña
  resetPassword(email: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${this.url}/api/auth/reset-password`, { email, newPassword })
      .pipe(
        catchError(err => of({ ok: false, msj: err.error?.msj || 'Error al restablecer contraseña' }))
      );
  }

  logOut() {
    sessionStorage.clear();
    this._usuario = null;
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private url: string = environment.baseUrl;

  constructor(private http: HttpClient) { }

  // Obtener administradores activos
  obtenerAdministradores(page: number = 1, limit: number = 10, search: string = ''): Observable<any> {
    const headers = new HttpHeaders()
      .set('token', sessionStorage.getItem('token') || '');

    const params = `?page=${page}&limit=${limit}&search=${search}`;

    return this.http.get<any>(`${this.url}/api/admins${params}`, { headers })
      .pipe(
        catchError(err => of({ ok: false, msj: err.error?.msj || 'Error al obtener administradores' }))
      );
  }

  // Obtener administradores eliminados
  obtenerAdministradoresEliminados(page: number = 1, limit: number = 10, search: string = ''): Observable<any> {
    const headers = new HttpHeaders()
      .set('token', sessionStorage.getItem('token') || '');

    const params = `?page=${page}&limit=${limit}&search=${search}`;

    return this.http.get<any>(`${this.url}/api/admins/eliminados${params}`, { headers })
      .pipe(
        catchError(err => of({ ok: false, msj: err.error?.msj || 'Error al obtener administradores eliminados' }))
      );
  }

  // Crear nuevo administrador
  crearAdministrador(administrador: any): Observable<any> {
    const headers = new HttpHeaders()
      .set('token', sessionStorage.getItem('token') || '');

    return this.http.post<any>(`${this.url}/api/admins`, administrador, { headers })
      .pipe(
        catchError(err => of({ ok: false, msj: err.error?.msj || 'Error al crear administrador' }))
      );
  }

  // Obtener administrador por ID
  obtenerAdministradorPorId(id: number): Observable<any> {
    const headers = new HttpHeaders()
      .set('token', sessionStorage.getItem('token') || '');

    return this.http.get<any>(`${this.url}/api/admins/${id}`, { headers })
      .pipe(
        catchError(err => of({ ok: false, msj: err.error?.msj || 'Error al obtener administrador' }))
      );
  }

  // Actualizar administrador
  actualizarAdministrador(id: number, administrador: any): Observable<any> {
    const headers = new HttpHeaders()
      .set('token', sessionStorage.getItem('token') || '');

    return this.http.put<any>(`${this.url}/api/admins/${id}`, administrador, { headers })
      .pipe(
        catchError(err => of({ ok: false, msj: err.error?.msj || 'Error al actualizar administrador' }))
      );
  }

  // Desactivar administrador
  desactivarAdministrador(id: number): Observable<any> {
    const headers = new HttpHeaders()
      .set('token', sessionStorage.getItem('token') || '');

    return this.http.delete<any>(`${this.url}/api/admins/${id}`, { headers })
      .pipe(
        catchError(err => of({ ok: false, msj: err.error?.msj || 'Error al desactivar administrador' }))
      );
  }

  // Reactivar administrador
  reactivarAdministrador(id: number): Observable<any> {
    const headers = new HttpHeaders()
      .set('token', sessionStorage.getItem('token') || '');

    return this.http.put<any>(`${this.url}/api/admins/reactivar/${id}`, {}, { headers })
      .pipe(
        catchError(err => of({ ok: false, msj: err.error?.msj || 'Error al reactivar administrador' }))
      );
  }

  // Eliminar administrador permanentemente
  eliminarAdministradorPermanentemente(id: number): Observable<any> {
    const headers = new HttpHeaders()
      .set('token', sessionStorage.getItem('token') || '');

    return this.http.delete<any>(`${this.url}/api/admins/eliminar-permanente/${id}`, { headers })
      .pipe(
        catchError(err => of({ ok: false, msj: err.error?.msj || 'Error al eliminar administrador permanentemente' }))
      );
  }

  // Obtener mi perfil de administrador
  obtenerMiPerfil(): Observable<any> {
    const headers = new HttpHeaders()
      .set('token', sessionStorage.getItem('token') || '');

    return this.http.get<any>(`${this.url}/api/admins/mi-perfil`, { headers })
      .pipe(
        catchError(err => of({ ok: false, msj: err.error?.msj || 'Error al obtener mi perfil' }))
      );
  }

  // Actualizar mi perfil de administrador
  actualizarMiPerfil(perfilData: any): Observable<any> {
    const headers = new HttpHeaders()
      .set('token', sessionStorage.getItem('token') || '');

    return this.http.put<any>(`${this.url}/api/admins/mi-perfil`, perfilData, { headers })
      .pipe(
        catchError(err => of({ ok: false, msj: err.error?.msj || 'Error al actualizar mi perfil' }))
      );
  }
}

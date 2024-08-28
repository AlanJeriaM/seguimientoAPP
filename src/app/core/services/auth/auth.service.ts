import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment.prod'
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

  constructor(
    private http: HttpClient,
  ) { }

  registerUser(user: any): Observable<any> {
    return this.http.post<any>(`${this.url}/api/sign-in`, user)
      .pipe(
        tap(resp => {
          if (resp.ok) {
            sessionStorage.setItem('token', resp.token)
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

  // Obtiene el jwt guardado en LocalStorage
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

  logOut() {
    sessionStorage.clear();
  }
}

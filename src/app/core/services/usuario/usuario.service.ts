import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Observable, Subject, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private url: string = environment.baseUrl; //Esta propiedad almacena la URL base de la API, que proviene del archivo de configuración de entornos

  // Es un Subject de tipo void. Un Subject es un tipo especial de Observable que puede emitir nuevos valores cuando lo deseemos.
  // En este caso, se usa para notificar que los usuarios han sido actualizados y que otros componentes pueden "escuchar" este cambio.
  private refreshUsuarios = new Subject<void>();


  constructor( private http: HttpClient) { }

  //devuelve el Subject que permite a otros componentes suscribirse y escuchar cuándo se han hecho cambios en los usuarios.
  get refresh() {
    return this.refreshUsuarios;
  }


//método que realiza una solicitud GET para obtener los datos de un usuario específico basado en su id.
  getUsuario(id: string): Observable<any> {
    return this.http.get<any>(`${this.url}/api/usuario/${id}`);
  }

  //método construye una URL con parámetros de consulta (query parameters) basados en los filtros proporcionados. Se utiliza para obtener una lista de usuarios filtrados según ciertos criterios.
  getAllUsersById(filters: any): Observable<any> {
    const queryParams = { ...filters };
    const queryString = Object.keys(queryParams)
      .map(key => `${key}=${encodeURIComponent(queryParams[key])}`)
      .join('&');

    const urlWithQuery = `${this.url}/api/usuario?${queryString}`;
    return this.http.get<any>(urlWithQuery);
  }

  //Este método funciona de manera similar al anterior, pero llaman a diferentes endpoints para obtener usuarios suspendidos.
  getAllUsuariosSuspended(filters: any) {
    const queryParams = { ...filters };
    const queryString = Object.keys(queryParams)
      .map(key => `${key}=${encodeURIComponent(queryParams[key])}`)
      .join('&');

    const urlWithQuery = `${this.url}/api/usuario/suspended/?${queryString}`;
    return this.http.get<any>(urlWithQuery);
  }

  //Este método funciona de manera similar al anterior, pero llaman a diferentes endpoints para obtener usuarios eliminados.
  getAllUsuariosDeleted(filters: any) {
    const queryParams = { ...filters };
    const queryString = Object.keys(queryParams)
      .map(key => `${key}=${encodeURIComponent(queryParams[key])}`)
      .join('&');

    const urlWithQuery = `${this.url}/api/usuario/deleted/?${queryString}`;
    return this.http.get<any>(urlWithQuery);
  }

  //Este método realiza una solicitud PUT para actualizar los datos de un usuario con un determinado id.
  updateUser(id: string, userUpdate: any) {
    return this.http.put<any>(`${this.url}/api/usuario/${id}`, userUpdate);
  }

  //Este método realiza una solicitud PUT para suspender a un usuario específico. Se envía un cuerpo vacío ({}) en la solicitud.
   suspenderUsuario(id: any) {
    return this.http.put<any>(`${this.url}/api/usuario/suspend/${id}`, {});
  }

  //Este método realiza una solicitud DELETE para eliminar un usuario.
  deleteUsuario(id: any) {
    return this.http.delete<any>(`${this.url}/api/usuario/delete/${id}`, {});
  }

  //Este método realiza una solicitud PUT para activar a un usuario.
  //Luego, con el operador tap(), se emite un evento a través del Subject refreshUsuarios, que notifica a los componentes suscritos que deben refrescar su lista de usuarios.
  activarUsuario(id: string) {
    return this.http.put<any>(`${this.url}/api/usuario/activate/${id}`, id)
      .pipe(
        tap(() => {
          this.refresh.next();
        }),
      );
  }





}

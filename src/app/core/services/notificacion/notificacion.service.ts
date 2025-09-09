import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Notificacion {
  id: number;
  tipo: 'NUEVA_ENCUESTA' | 'RECORDATORIO' | 'ENCUESTA_COMPLETADA' | 'SISTEMA';
  titulo: string;
  mensaje: string;
  leida: boolean;
  fecha_leida?: Date;
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  fecha_creacion: Date;
  encuesta_id?: number;
}

export interface NotificacionesResponse {
  notificaciones: Notificacion[];
  total: number;
  page: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {
  private baseUrl = `${environment.baseUrl}/api/respuestas`;
  
  // BehaviorSubject para el contador de notificaciones no leídas
  private contadorNoLeidasSubject = new BehaviorSubject<number>(0);
  public contadorNoLeidas$ = this.contadorNoLeidasSubject.asObservable();

  constructor(private http: HttpClient) {
    // No hacer polling automático - se inicializará manualmente cuando sea necesario
  }

  /**
   * Obtiene las notificaciones del usuario
   */
  obtenerNotificaciones(page: number = 1, limit: number = 20, noLeidas: boolean = false): Observable<{ok: boolean, data: NotificacionesResponse}> {
    const params: any = { page: page.toString(), limit: limit.toString() };
    if (noLeidas) {
      params.no_leidas = 'true';
    }
    
    return this.http.get<{ok: boolean, data: NotificacionesResponse}>(`${this.baseUrl}/notificaciones`, { params });
  }

  /**
   * Marca una notificación como leída
   */
  marcarComoLeida(notificacionId: number): Observable<{ok: boolean, msj: string}> {
    return this.http.put<{ok: boolean, msj: string}>(`${this.baseUrl}/notificaciones/${notificacionId}/leida`, {});
  }

  /**
   * Obtiene solo el contador de notificaciones no leídas
   */
  obtenerContadorNoLeidas(): Observable<{ok: boolean, data: NotificacionesResponse}> {
    return this.http.get<{ok: boolean, data: NotificacionesResponse}>(`${this.baseUrl}/notificaciones?no_leidas=true&limit=1`);
  }

  /**
   * Actualiza el contador de notificaciones no leídas
   */
  actualizarContadorNoLeidas(): void {
    this.obtenerContadorNoLeidas().subscribe({
      next: (response) => {
        if (response.ok) {
          this.contadorNoLeidasSubject.next(response.data.total);
        }
      },
      error: (error) => {
        console.error('Error al obtener contador de notificaciones:', error);
      }
    });
  }

  /**
   * Inicializa el servicio cargando el contador inicial
   */
  inicializar(): void {
    this.actualizarContadorNoLeidas();
  }

  /**
   * Decrementa el contador local cuando se marca una notificación como leída
   */
  decrementarContador(): void {
    const contadorActual = this.contadorNoLeidasSubject.value;
    if (contadorActual > 0) {
      this.contadorNoLeidasSubject.next(contadorActual - 1);
    }
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Pregunta {
  id?: number;
  texto: string;
  tipo: 'TEXTO_CORTO' | 'TEXTO_LARGO' | 'OPCION_UNICA' | 'OPCION_MULTIPLE' | 'ESCALA' | 'FECHA' | 'NUMERO';
  es_requerida: boolean;
  orden?: number;
  opciones?: string[];
  configuracion?: any;
}

export interface Encuesta {
  id?: number;
  titulo: string;
  descripcion?: string;
  estado: 'BORRADOR' | 'ACTIVA';
  fecha_inicio?: Date;
  fecha_fin?: Date;
  es_anonima: boolean;
  admin_creador_id?: number;
  preguntas?: Pregunta[];
  fecha_creacion?: Date;
  fecha_actualizacion?: Date;
  total_respuestas?: number;
  total_preguntas?: number;
}

export interface Respuesta {
  pregunta_id: number;
  respuesta: string;
}

export interface RespuestaEncuesta {
  respuestas: Respuesta[];
  session_token: string;
}

export interface Notificacion {
  id: number;
  tipo: 'NUEVA_ENCUESTA' | 'RECORDATORIO' | 'ENCUESTA_COMPLETADA' | 'SISTEMA';
  titulo: string;
  mensaje: string;
  leida: boolean;
  fecha_leida?: Date;
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  fecha_creacion: Date;
}

@Injectable({
  providedIn: 'root'
})
export class EncuestaService {

  private baseUrl = `${environment.baseUrl}/api/encuestas`;

  constructor(private http: HttpClient) { }

  // Crear nueva encuesta
  crearEncuesta(encuesta: Encuesta): Observable<any> {
    return this.http.post(this.baseUrl, encuesta);
  }

  // Obtener todas las encuestas del admin
  obtenerEncuestas(page: number = 1, limit: number = 10, estado?: string, search?: string): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (estado && estado !== 'TODOS') {
      params = params.set('estado', estado);
    }

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get(this.baseUrl, { params });
  }

  // Obtener encuesta por ID
  obtenerEncuestaPorId(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  // Actualizar encuesta
  actualizarEncuesta(id: number, encuesta: Encuesta): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, encuesta);
  }

  // Eliminar encuesta (soft delete)
  eliminarEncuesta(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  // Obtener encuestas eliminadas
  obtenerEncuestasEliminadas(page: number = 1, limit: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get(`${this.baseUrl}/eliminadas`, { params });
  }

  // Reactivar encuesta
  reactivarEncuesta(id: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/reactivar/${id}`, {});
  }

  // Eliminar encuesta permanentemente
  eliminarEncuestaPermanentemente(id: number, forceDelete: boolean = false): Observable<any> {
    let params = new HttpParams();
    if (forceDelete) {
      params = params.set('force_delete', 'true');
    }
    return this.http.delete(`${this.baseUrl}/eliminar-permanente/${id}`, { params });
  }

  // Obtener estadísticas generales
  obtenerEstadisticasGenerales(): Observable<any> {
    return this.http.get(`${this.baseUrl}/reportes/estadisticas-generales`);
  }

  // Obtener reporte de encuesta
  obtenerReporteEncuesta(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}/reporte`);
  }

  // Obtener tendencias de participación
  obtenerTendenciasParticipacion(dias: number = 30): Observable<any> {
    const params = new HttpParams().set('dias', dias.toString());
    return this.http.get(`${this.baseUrl}/reportes/tendencias`, { params });
  }

  // Obtener comparación entre encuestas
  obtenerComparacionEncuestas(encuestaIds: number[]): Observable<any> {
    const params = new HttpParams().set('encuesta_ids', JSON.stringify(encuestaIds));
    return this.http.get(`${this.baseUrl}/reportes/comparacion`, { params });
  }

  // Exportar datos de encuesta
  exportarDatosEncuesta(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}/exportar`);
  }
}

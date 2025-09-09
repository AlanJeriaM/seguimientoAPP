import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface EncuestaDisponible {
  id: number;
  titulo: string;
  descripcion: string;
  tiempo_estimado: number;
  es_anonima: boolean;
  permite_multiple_respuesta: boolean;
  fecha_inicio: Date;
  fecha_fin: Date;
  ya_respondida: boolean;
  total_preguntas: number;
  // Campos calculados para el frontend
  progreso?: number;
  estado_usuario?: 'NO_INICIADA' | 'EN_PROGRESO' | 'COMPLETADA';
  ultima_respuesta?: Date;
}

export interface EncuestasDisponiblesResponse {
  encuestas: EncuestaDisponible[];
  total: number;
  page: number;
  totalPages: number;
}

export interface EncuestaParaResponder {
  id: number;
  titulo: string;
  descripcion: string;
  tiempo_estimado: number;
  es_anonima: boolean;
  permite_multiple_respuesta: boolean;
  preguntas: PreguntaParaResponder[];
}

export interface PreguntaParaResponder {
  id: number;
  texto: string;
  tipo: 'TEXTO_CORTO' | 'TEXTO_LARGO' | 'OPCION_UNICA' | 'OPCION_MULTIPLE' | 'ESCALA' | 'FECHA' | 'NUMERO';
  es_requerida: boolean;
  orden: number;
  opciones?: string[];
  configuracion?: any;
}

export interface RespuestaUsuario {
  pregunta_id: number;
  respuesta: string;
  tiempo_respuesta?: number;
}

export interface HistorialEncuesta {
  id: number;
  titulo: string;
  descripcion: string;
  fecha_completada: Date;
  tiempo_invertido: number;
  total_preguntas: number;
  total_respuestas: number;
  porcentaje_completado: number;
  estado: 'COMPLETADA';
  puede_ver_resultados: boolean;
  fecha_inicio_encuesta: Date;
  fecha_fin_encuesta: Date;
}

@Injectable({
  providedIn: 'root'
})
export class RespuestaService {
  private baseUrl = `${environment.baseUrl}/api/respuestas`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene las encuestas disponibles para el usuario
   */
  obtenerEncuestasDisponibles(page: number = 1, limit: number = 10, search?: string): Observable<{ok: boolean, data: EncuestasDisponiblesResponse}> {
    const params: any = { page: page.toString(), limit: limit.toString() };
    if (search) {
      params.search = search;
    }
    
    return this.http.get<{ok: boolean, data: EncuestasDisponiblesResponse}>(`${this.baseUrl}/encuestas-disponibles`, { params });
  }

  /**
   * Obtiene una encuesta específica para responder
   */
  obtenerEncuestaParaResponder(encuestaId: number): Observable<{ok: boolean, data: {encuesta: EncuestaParaResponder, session_token: string, ya_respondida: boolean}}> {
    return this.http.get<{ok: boolean, data: {encuesta: EncuestaParaResponder, session_token: string, ya_respondida: boolean}}>(`${this.baseUrl}/encuesta/${encuestaId}`);
  }

  /**
   * Envía las respuestas de una encuesta
   */
  enviarRespuestas(encuestaId: number, respuestas: RespuestaUsuario[], sessionToken?: string): Observable<{ok: boolean, msj: string, data?: any}> {
    return this.http.post<{ok: boolean, msj: string, data?: any}>(`${this.baseUrl}/encuesta/${encuestaId}/respuestas`, {
      respuestas: respuestas,
      session_token: sessionToken
    });
  }

  /**
   * Obtiene el historial de encuestas completadas
   */
  obtenerHistorialEncuestas(page: number = 1, limit: number = 10): Observable<{ok: boolean, data: {historial: any[], total: number, page: number, totalPages: number}}> {
    const params = { page: page.toString(), limit: limit.toString() };
    return this.http.get<{ok: boolean, data: {historial: any[], total: number, page: number, totalPages: number}}>(`${this.baseUrl}/historial`, { params });
  }

  /**
   * Obtiene el progreso de una encuesta específica
   */
  obtenerProgresoEncuesta(encuestaId: number): Observable<{ok: boolean, data: {progreso: number, respuestas_completadas: number, total_preguntas: number}}> {
    return this.http.get<{ok: boolean, data: {progreso: number, respuestas_completadas: number, total_preguntas: number}}>(`${this.baseUrl}/progreso/${encuestaId}`);
  }

  /**
   * Guarda el progreso parcial de una encuesta
   */
  guardarProgreso(encuestaId: number, respuestas: RespuestaUsuario[]): Observable<{ok: boolean, msj: string}> {
    return this.http.post<{ok: boolean, msj: string}>(`${this.baseUrl}/guardar-progreso`, {
      encuesta_id: encuestaId,
      respuestas: respuestas
    });
  }

  /**
   * Mapea una encuesta disponible del backend al formato del frontend
   */
  mapearEncuestaDisponible(encuesta: any): EncuestaDisponible {
    return {
      ...encuesta,
      fecha_inicio: new Date(encuesta.fecha_inicio),
      fecha_fin: new Date(encuesta.fecha_fin),
      estado_usuario: encuesta.ya_respondida ? 'COMPLETADA' : 'NO_INICIADA',
      progreso: encuesta.ya_respondida ? 100 : 0,
      ultima_respuesta: encuesta.ultima_respuesta ? new Date(encuesta.ultima_respuesta) : undefined
    };
  }

  /**
   * Mapea una encuesta del historial del backend al formato del frontend
   */
  mapearHistorialEncuesta(encuesta: any): HistorialEncuesta {
    return {
      ...encuesta,
      fecha_completada: new Date(encuesta.fecha_completada),
      fecha_inicio_encuesta: new Date(encuesta.fecha_inicio_encuesta),
      fecha_fin_encuesta: new Date(encuesta.fecha_fin_encuesta),
      estado: 'COMPLETADA' as const,
      puede_ver_resultados: true // Por defecto, permitir ver resultados
    };
  }
}
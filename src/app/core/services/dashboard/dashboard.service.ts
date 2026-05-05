import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// Interfaces para el Dashboard
export interface EstadisticasMercado {
  totalProfesionales: number;
  nuevosProfesionalesEsteMes: number;
  empresasUnicas: number;
  industriasUnicas: number;
  profesionalesMesAnterior: number;
}

export interface TecnologiaDemandada {
  nombre: string;
  demanda: number;
}

export interface DistribucionSalarial {
  industria: string;
  cantidad: number;
  salarioMinimo: number;
  salarioMaximo: number;
  salarioPromedio: number;
  variacionMensual: number;
}

export interface EmpresaContratante {
  empresa: string;
  totalEmpleados: number;
  promedioSalario: number;
  satisfaccionPromedio: number | null;
  tipoEmpresa: string;
}

export interface TendenciaMensual {
  mes: string;
  nuevosRegistros: number;
  perfilesCompletos: number;
}

export interface TendenciasMercado {
  ultimosSeisMeses: TendenciaMensual[];
  resumen: {
    crecimientoMensual: number;
    totalRegistros: number;
    porcentajePerfilCompleto: number;
  };
}

export interface PerfilUsuario {
  id: number;
  nombre: string;
  correo: string;
  perfil_imagen_url: string | null;
  posicion_actual: string;
  empresa_actual: string;
  ubicacion: string;
  resumen: string;
  industria: string;
  rol: string;
}

// Nuevas interfaces para métricas avanzadas
export interface DistribucionExperiencia {
  rango: string;
  cantidad: number;
  porcentaje: number;
}

export interface DistribucionEducacion {
  nivel: string;
  cantidad: number;
  porcentaje: number;
}

export interface TecnologiaPopular {
  tecnologia: string;
  cantidad: number;
  porcentaje: number;
}

export interface EstadisticasSalariales {
  rango: string;
  cantidad: number;
  porcentaje: number;
}

export interface DistribucionAreas {
  area: string;
  cantidad: number;
  porcentaje: number;
}

export interface MetricasAvanzadas {
  distribucionExperiencia: DistribucionExperiencia[];
  distribucionEducacion: DistribucionEducacion[];
  tecnologiasPopulares: TecnologiaPopular[];
  estadisticasSalariales: EstadisticasSalariales[];
  distribucionAreas: DistribucionAreas[];
  tiposEmpleo: {
    tipo: string;
    cantidad: number;
    porcentaje: number;
  }[];
}

// Interfaces para satisfacción laboral
export interface EmpresaSatisfaccion {
  empresa: string;
  satisfaccionPromedio: number;
  totalRespuestas: number;
  distribucion: {
    estrellas1: number;
    estrellas2: number;
    estrellas3: number;
    estrellas4: number;
    estrellas5: number;
  };
}

export interface SatisfaccionLaboral {
  empresas: EmpresaSatisfaccion[];
  general: {
    satisfaccionPromedio: number;
    totalRespuestas: number;
    distribucion: {
      estrellas1: number;
      estrellas2: number;
      estrellas3: number;
      estrellas4: number;
      estrellas5: number;
    };
  };
}

// Interfaces para evolución salarial
export interface EvolucionSalarialItem {
  rangoExperiencia: string;
  añosMinimos: number;
  añosMaximos: number;
  salarioPromedio: number;
  cantidad: number;
  salarioMinimo: number;
  salarioMaximo: number;
}

export interface EvolucionSalarial {
  datos: EvolucionSalarialItem[];
  resumen: {
    salarioPromedioGeneral: number;
    experienciaPromedio: number;
    totalProfesionales: number;
    rangosConDatos: number;
  };
}

// Interfaces para distribución de experiencia
export interface DistribucionExperienciaItem {
  rangoExperiencia: string;
  añosMinimos: number;
  añosMaximos: number;
  cantidad: number;
  porcentaje: number;
}

export interface DistribucionExperienciaData {
  datos: DistribucionExperienciaItem[];
  resumen: {
    totalProfesionales: number;
    experienciaPromedio: number;
    experienciaMediana: number;
    rangoMasPopular: {
      rango: string;
      cantidad: number;
      porcentaje: number;
    } | null;
    rangosConDatos: number;
  };
}

// Interfaces para experiencia vs tecnologías
export interface ExperienciaVsTecnologiasItem {
  rangoExperiencia: string;
  añosMinimos: number;
  añosMaximos: number;
  cantidad: number;
  promedioTecnologias: number;
  mediaTecnologias: number;
  maxTecnologias: number;
  minTecnologias: number;
}

export interface ExperienciaVsTecnologiasData {
  datos: ExperienciaVsTecnologiasItem[];
  resumen: {
    totalProfesionales: number;
    promedioGeneralTecnologias: number;
    experienciaPromedio: number;
    maxTecnologiasEncontradas: number;
    rangosConDatos: number;
  };
}

// Interfaces para mapa de calor industria vs salario
export interface MapaCalorCelda {
  rangoSalarial: string;
  rangoLabel: string;
  cantidad: number;
  orden: number;
}

export interface MapaCalorFila {
  industria: string;
  datos: MapaCalorCelda[];
  totalProfesionales: number;
}

export interface RangoSalarial {
  id: string;
  label: string;
  orden: number;
}

export interface MapaCalorData {
  datos: MapaCalorFila[];
  rangosSalariales: RangoSalarial[];
  estadisticas: {
    totalProfesionales: number;
    totalIndustrias: number;
    maxProfesionalesPorCelda: number;
    industriaMasComun: {
      nombre: string;
      profesionales: number;
    } | null;
    distribucionPorRango: {
      rango: string;
      cantidad: number;
      porcentaje: number;
    }[];
  };
}

// Interfaces para disponibilidad de cambio de trabajo
export interface DisponibilidadCambioItem {
  disponibilidad: string;
  cantidad: number;
  porcentaje: number;
}

export interface DisponibilidadCambioData {
  datos: DisponibilidadCambioItem[];
  resumen: {
    totalProfesionales: number;
    usuariosActivos: number;
    usuariosAbiertos: number;
    usuariosNoDisponibles: number;
    usuariosSinTrabajo: number;
    usuariosIndecisos: number;
    usuariosPotencialmenteDisponibles: number;
    porcentajePotencialmenteDisponibles: number;
    opcionMasComun: {
      disponibilidad: string;
      cantidad: number;
      porcentaje: number;
    } | null;
    opcionesConDatos: number;
  };
}

// Nuevas interfaces
export interface TecnologiaSalario {
  tecnologia: string;
  salarioPromedio: number;
  cantidad: number;
}

export interface SalarioEducacion {
  nivelEducacion: string;
  salarioPromedio: number;
  salarioMinimo: number;
  salarioMaximo: number;
  cantidad: number;
}

export interface TipoEmpleoSatisfaccion {
  tipoEmpleo: string;
  satisfaccionPromedio: number;
  cantidad: number;
}

export interface ProyeccionTecnologias {
  historico: Array<{
    mes: string;
    tecnologias: { [key: string]: number };
  }>;
  proyeccion: Array<{
    mes: string;
    esProyeccion: boolean;
  }>;
  top5Tecnologias: string[];
}

export interface IndiceEmpleabilidad {
  distribucion: Array<{
    rango: string;
    cantidad: number;
  }>;
  scorePromedio: number;
  totalPerfiles: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private url: string = environment.baseUrl;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders()
      .set('token', sessionStorage.getItem('token') || '');
  }

  // Obtener estadísticas generales del mercado laboral
  obtenerEstadisticasMercado(): Observable<{ ok: boolean; estadisticas?: EstadisticasMercado; msj?: string }> {
    return this.http.get<any>(`${this.url}/api/dashboard/estadisticas-mercado`, { headers: this.getHeaders() })
      .pipe(
        catchError(err => of({
          ok: false,
          msj: err.error?.msj || 'Error al obtener estadísticas del mercado'
        }))
      );
  }

  // Obtener tecnologías más demandadas
  obtenerTecnologiasMasDemandadas(): Observable<{ ok: boolean; tecnologias?: TecnologiaDemandada[]; msj?: string }> {
    return this.http.get<any>(`${this.url}/api/dashboard/tecnologias-demandadas`, { headers: this.getHeaders() })
      .pipe(
        catchError(err => of({
          ok: false,
          msj: err.error?.msj || 'Error al obtener tecnologías demandadas'
        }))
      );
  }

  // Obtener distribución salarial por industria
  obtenerDistribucionSalarial(): Observable<{ ok: boolean; distribucionSalarial?: DistribucionSalarial[]; msj?: string }> {
    return this.http.get<any>(`${this.url}/api/dashboard/distribucion-salarial`, { headers: this.getHeaders() })
      .pipe(
        catchError(err => of({
          ok: false,
          msj: err.error?.msj || 'Error al obtener distribución salarial'
        }))
      );
  }

  // Obtener empresas que más contratan
  obtenerEmpresasQueContratanMas(): Observable<{ ok: boolean; empresas?: EmpresaContratante[]; msj?: string }> {
    return this.http.get<any>(`${this.url}/api/dashboard/empresas-contratan`, { headers: this.getHeaders() })
      .pipe(
        catchError(err => of({
          ok: false,
          msj: err.error?.msj || 'Error al obtener empresas que contratan'
        }))
      );
  }

  // Obtener tendencias del mercado laboral
  obtenerTendenciasMercado(): Observable<{ ok: boolean; tendencias?: TendenciasMercado; msj?: string }> {
    return this.http.get<any>(`${this.url}/api/dashboard/tendencias-mercado`, { headers: this.getHeaders() })
      .pipe(
        catchError(err => of({
          ok: false,
          msj: err.error?.msj || 'Error al obtener tendencias del mercado'
        }))
      );
  }

  // Obtener perfil del usuario actual (para la sección personal)
  obtenerPerfilUsuario(): Observable<{ ok: boolean; usuario?: PerfilUsuario; msj?: string }> {
    const token = sessionStorage.getItem('token');
    if (!token) {
      return of({ ok: false, msj: 'No hay token de autenticación' });
    }

    // Decodificar el token para obtener el rol del usuario
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const rol = payload.rol;

      // Usar la ruta correcta según el rol
      if (rol === 'ADMIN-USER') {
        return this.http.get<any>(`${this.url}/api/admins/mi-perfil`, { headers: this.getHeaders() })
          .pipe(
            catchError(err => of({
              ok: false,
              msj: err.error?.msj || 'Error al obtener perfil del administrador'
            }))
          );
      } else {
        return this.http.get<any>(`${this.url}/api/users/mi-perfil`, { headers: this.getHeaders() })
          .pipe(
            catchError(err => of({
              ok: false,
              msj: err.error?.msj || 'Error al obtener perfil del usuario'
            }))
          );
      }
    } catch (error) {
      console.error('Error decodificando token:', error);
      // Fallback a la ruta de usuarios si no se puede decodificar el token
      return this.http.get<any>(`${this.url}/api/users/mi-perfil`, { headers: this.getHeaders() })
        .pipe(
          catchError(err => of({
            ok: false,
            msj: err.error?.msj || 'Error al obtener perfil del usuario'
          }))
        );
    }
  }

  // Método auxiliar para obtener todos los datos del dashboard de una vez
  obtenerDatosDashboard(): Observable<{
    estadisticasMercado?: EstadisticasMercado;
    tecnologias?: TecnologiaDemandada[];
    distribucionSalarial?: DistribucionSalarial[];
    empresas?: EmpresaContratante[];
    tendencias?: TendenciasMercado;
    perfilUsuario?: PerfilUsuario;
    errores: string[];
  }> {
    return new Observable(observer => {
      const errores: string[] = [];
      const resultados: any = {};

      // Ejecutar todas las llamadas en paralelo
      Promise.all([
        this.obtenerEstadisticasMercado().toPromise(),
        this.obtenerTecnologiasMasDemandadas().toPromise(),
        this.obtenerDistribucionSalarial().toPromise(),
        this.obtenerEmpresasQueContratanMas().toPromise(),
        this.obtenerTendenciasMercado().toPromise(),
        this.obtenerPerfilUsuario().toPromise()
      ]).then(([
        estadisticasResp,
        tecnologiasResp,
        distribucionResp,
        empresasResp,
        tendenciasResp,
        perfilResp
      ]) => {

        if (estadisticasResp?.ok) {
          resultados.estadisticasMercado = estadisticasResp.estadisticas;
        } else {
          errores.push(estadisticasResp?.msj || 'Error en estadísticas');
        }

        if (tecnologiasResp?.ok) {
          resultados.tecnologias = tecnologiasResp.tecnologias;
        } else {
          errores.push(tecnologiasResp?.msj || 'Error en tecnologías');
        }

        if (distribucionResp?.ok) {
          resultados.distribucionSalarial = distribucionResp.distribucionSalarial;
        } else {
          errores.push(distribucionResp?.msj || 'Error en distribución salarial');
        }

        if (empresasResp?.ok) {
          resultados.empresas = empresasResp.empresas;
        } else {
          errores.push(empresasResp?.msj || 'Error en empresas');
        }

        if (tendenciasResp?.ok) {
          resultados.tendencias = tendenciasResp.tendencias;
        } else {
          errores.push(tendenciasResp?.msj || 'Error en tendencias');
        }

        if (perfilResp?.ok) {
          resultados.perfilUsuario = perfilResp.usuario;
        } else {
          errores.push(perfilResp?.msj || 'Error en perfil de usuario');
        }

        observer.next({ ...resultados, errores });
        observer.complete();

      }).catch(error => {
        console.error('Error general en obtenerDatosDashboard:', error);
        observer.next({
          errores: ['Error general al cargar datos del dashboard']
        });
        observer.complete();
      });
    });
  }

  // Obtener métricas avanzadas basadas en los nuevos campos del perfil
  obtenerMetricasAvanzadas(): Observable<{ ok: boolean; metricas?: MetricasAvanzadas; msj?: string }> {
    return this.http.get<any>(`${this.url}/api/dashboard/metricas-avanzadas`, { headers: this.getHeaders() })
      .pipe(
        catchError(err => of({
          ok: false,
          msj: err.error?.msj || 'Error al obtener métricas avanzadas'
        }))
      );
  }

  // Obtener satisfacción laboral
  obtenerSatisfaccionLaboral(): Observable<{ ok: boolean; satisfaccion?: SatisfaccionLaboral; msj?: string }> {
    return this.http.get<any>(`${this.url}/api/dashboard/satisfaccion-laboral`, { headers: this.getHeaders() })
      .pipe(
        catchError(err => of({
          ok: false,
          msj: err.error?.msj || 'Error al obtener satisfacción laboral'
        }))
      );
  }

  // Obtener evolución salarial por años de experiencia
  obtenerEvolucionSalarial(): Observable<{ ok: boolean; evolucion?: EvolucionSalarial; msj?: string }> {
    return this.http.get<any>(`${this.url}/api/dashboard/evolucion-salarial`, { headers: this.getHeaders() })
      .pipe(
        catchError(err => of({
          ok: false,
          msj: err.error?.msj || 'Error al obtener evolución salarial'
        }))
      );
  }

  // Obtener distribución de profesionales por años de experiencia
  obtenerDistribucionExperiencia(): Observable<{ ok: boolean; distribucion?: DistribucionExperienciaData; msj?: string }> {
    return this.http.get<any>(`${this.url}/api/dashboard/distribucion-experiencia`, { headers: this.getHeaders() })
      .pipe(
        catchError(err => of({
          ok: false,
          msj: err.error?.msj || 'Error al obtener distribución de experiencia'
        }))
      );
  }

  // Obtener relación experiencia vs tecnologías
  obtenerExperienciaVsTecnologias(): Observable<{ ok: boolean; experienciaVsTecnologias?: ExperienciaVsTecnologiasData; msj?: string }> {
    return this.http.get<any>(`${this.url}/api/dashboard/experiencia-vs-tecnologias`, { headers: this.getHeaders() })
      .pipe(
        catchError(err => of({
          ok: false,
          msj: err.error?.msj || 'Error al obtener relación experiencia vs tecnologías'
        }))
      );
  }

  // Obtener mapa de calor industria vs salario
  obtenerMapaCalorIndustriaSalarial(): Observable<{ ok: boolean; mapaCalor?: MapaCalorData; msj?: string }> {
    return this.http.get<any>(`${this.url}/api/dashboard/mapa-calor-industria-salarial`, { headers: this.getHeaders() })
      .pipe(
        catchError(err => of({
          ok: false,
          msj: err.error?.msj || 'Error al obtener mapa de calor industria vs salario'
        }))
      );
  }

  // Obtener disponibilidad para cambio de trabajo
  obtenerDisponibilidadCambioTrabajo(): Observable<{ ok: boolean; disponibilidadCambio?: DisponibilidadCambioData; msj?: string }> {
    return this.http.get<any>(`${this.url}/api/dashboard/disponibilidad-cambio-trabajo`, { headers: this.getHeaders() })
      .pipe(
        catchError(err => of({
          ok: false,
          msj: err.error?.msj || 'Error al obtener disponibilidad de cambio de trabajo'
        }))
      );
  }

  // Nuevos métodos
  obtenerTecnologiasVsSalario(): Observable<{ ok: boolean; tecnologiasVsSalario?: TecnologiaSalario[]; msj?: string }> {
    return this.http.get<any>(`${this.url}/api/dashboard/tecnologias-vs-salario`, { headers: this.getHeaders() })
      .pipe(catchError(err => of({ ok: false, msj: err.error?.msj || 'Error al obtener tecnologías vs salario' })));
  }

  obtenerSalarioVsEducacion(): Observable<{ ok: boolean; salarioVsEducacion?: SalarioEducacion[]; msj?: string }> {
    return this.http.get<any>(`${this.url}/api/dashboard/salario-vs-educacion`, { headers: this.getHeaders() })
      .pipe(catchError(err => of({ ok: false, msj: err.error?.msj || 'Error al obtener salario vs educación' })));
  }

  obtenerTipoEmpleoVsSatisfaccion(): Observable<{ ok: boolean; tipoEmpleoVsSatisfaccion?: TipoEmpleoSatisfaccion[]; msj?: string }> {
    return this.http.get<any>(`${this.url}/api/dashboard/tipo-empleo-vs-satisfaccion`, { headers: this.getHeaders() })
      .pipe(catchError(err => of({ ok: false, msj: err.error?.msj || 'Error al obtener tipo empleo vs satisfacción' })));
  }

  obtenerProyeccionDemandaTecnologias(): Observable<{ ok: boolean; proyeccion?: ProyeccionTecnologias; msj?: string }> {
    return this.http.get<any>(`${this.url}/api/dashboard/proyeccion-demanda-tecnologias`, { headers: this.getHeaders() })
      .pipe(catchError(err => of({ ok: false, msj: err.error?.msj || 'Error al obtener proyección de tecnologías' })));
  }

  obtenerIndiceEmpleabilidad(): Observable<{ ok: boolean; indiceEmpleabilidad?: IndiceEmpleabilidad; msj?: string }> {
    return this.http.get<any>(`${this.url}/api/dashboard/indice-empleabilidad`, { headers: this.getHeaders() })
      .pipe(catchError(err => of({ ok: false, msj: err.error?.msj || 'Error al obtener índice de empleabilidad' })));
  }
}

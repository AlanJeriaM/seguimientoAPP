import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { EncuestaService } from '../../../core/services/encuesta/encuesta.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-view-encuestas-resultados',
  templateUrl: './view-encuestas-resultados.component.html',
  styleUrls: ['./view-encuestas-resultados.component.css']
})
export class ViewEncuestasResultadosComponent implements OnInit, OnDestroy {
  estadisticasGenerales: any = {};
  encuestasDisponibles: any[] = [];
  reporteEncuesta: any = {};
  loading = false;
  loadingEstadisticas = false;
  loadingReporte = false;
  encuestaIdSeleccionada: number | null = null;
  displayReporteDialog = false;

  private destroy$ = new Subject<void>();

  constructor(
    private encuestaService: EncuestaService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.cargarEstadisticasGenerales();
    this.cargarEncuestasDisponibles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarEstadisticasGenerales(): void {
    this.loadingEstadisticas = true;
    this.encuestaService.obtenerEstadisticasGenerales().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.ok) {
          this.estadisticasGenerales = response.data;
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: response.msj || 'Error al cargar estadísticas generales'
          });
        }
        this.loadingEstadisticas = false;
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error del servidor al cargar estadísticas'
        });
        this.loadingEstadisticas = false;
      }
    });
  }

  cargarEncuestasDisponibles(): void {
    this.loading = true;
    this.encuestaService.obtenerEncuestas(1, 100).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.ok) {
          this.encuestasDisponibles = response.data.encuestas;
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: response.msj || 'Error al cargar encuestas'
          });
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar encuestas:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error del servidor al cargar encuestas'
        });
        this.loading = false;
      }
    });
  }

  verReporteEncuesta(encuestaId: number): void {
    this.encuestaIdSeleccionada = encuestaId;
    this.loadingReporte = true;
    
    this.encuestaService.obtenerReporteEncuesta(encuestaId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.ok) {
          this.reporteEncuesta = response.data;
          this.displayReporteDialog = true;
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: response.msj || 'Error al cargar reporte'
          });
        }
        this.loadingReporte = false;
      },
      error: (error) => {
        console.error('Error al cargar reporte:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error del servidor al cargar reporte'
        });
        this.loadingReporte = false;
      }
    });
  }

  exportarDatosEncuesta(encuestaId: number): void {
    this.loading = true;
    
    this.encuestaService.exportarDatosEncuesta(encuestaId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.ok) {
          this.descargarCSV(response.data, `encuesta_${encuestaId}_datos.csv`);
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Datos exportados correctamente'
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: response.msj || 'Error al exportar datos'
          });
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al exportar datos:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error del servidor al exportar datos'
        });
        this.loading = false;
      }
    });
  }

  descargarCSV(data: any, filename: string): void {
    const csvContent = this.convertirACSV(data.datos);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  convertirACSV(datos: any[]): string {
    if (!datos || datos.length === 0) return '';
    
    const headers = Object.keys(datos[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of datos) {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  }

  cerrarReporteDialog(): void {
    this.displayReporteDialog = false;
    this.reporteEncuesta = {};
    this.encuestaIdSeleccionada = null;
  }

  actualizarDatos(): void {
    this.cargarEstadisticasGenerales();
    this.cargarEncuestasDisponibles();
  }

  getEstadoBadgeClass(estado: string, encuesta?: any): string {
    if (encuesta) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0); // Inicio del día actual
      
      // Si la encuesta está expirada, usar clase específica
      if (encuesta.fecha_fin) {
        const fechaFin = new Date(encuesta.fecha_fin);
        fechaFin.setHours(23, 59, 59, 999);
        
        if (fechaFin < hoy) {
          return 'estado-expirada';
        }
      }
      
      // Si la encuesta tiene fecha de inicio en el futuro, usar clase específica
      // Solo si el estado es ACTIVA
      if (encuesta.fecha_inicio && estado === 'ACTIVA') {
        const fechaInicio = new Date(encuesta.fecha_inicio);
        fechaInicio.setHours(0, 0, 0, 0);
        
        if (fechaInicio > hoy) {
          return 'estado-proximamente';
        }
      }
    }
    
    switch (estado) {
      case 'BORRADOR':
        return 'estado-borrador';
      case 'ACTIVA':
        return 'estado-activa';
      default:
        return 'estado-borrador';
    }
  }

  getEstadoLabel(estado: string, encuesta?: any): string {
    if (encuesta) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0); // Inicio del día actual
      
      // Si la encuesta tiene fecha de fin y ya pasó, mostrar "Expirada"
      if (encuesta.fecha_fin) {
        const fechaFin = new Date(encuesta.fecha_fin);
        fechaFin.setHours(23, 59, 59, 999); // Fin del día de expiración
        
        if (fechaFin < hoy) {
          return 'Expirada';
        }
      }
      
      // Si la encuesta tiene fecha de inicio en el futuro, mostrar "Próximamente"
      // Solo si el estado es ACTIVA
      if (encuesta.fecha_inicio && estado === 'ACTIVA') {
        const fechaInicio = new Date(encuesta.fecha_inicio);
        fechaInicio.setHours(0, 0, 0, 0); // Inicio del día de inicio
        
        if (fechaInicio > hoy) {
          return 'Próximamente';
        }
      }
    }
    
    switch (estado) {
      case 'BORRADOR':
        return 'Borrador';
      case 'ACTIVA':
        return 'Activa';
      default:
        return estado;
    }
  }

  getTipoPreguntaLabel(tipo: string): string {
    switch (tipo) {
      case 'TEXTO_CORTO':
        return 'Texto Corto';
      case 'TEXTO_LARGO':
        return 'Texto Largo';
      case 'OPCION_UNICA':
        return 'Opción Única';
      case 'OPCION_MULTIPLE':
        return 'Opción Múltiple';
      case 'ESCALA':
        return 'Escala';
      case 'FECHA':
        return 'Fecha';
      case 'NUMERO':
        return 'Número';
      default:
        return tipo;
    }
  }

  getPrioridadLabel(prioridad: string): string {
    switch (prioridad) {
      case 'BAJA':
        return 'Baja';
      case 'MEDIA':
        return 'Media';
      case 'ALTA':
        return 'Alta';
      case 'URGENTE':
        return 'Urgente';
      default:
        return prioridad;
    }
  }

  getPrioridadBadgeClass(prioridad: string): string {
    switch (prioridad) {
      case 'BAJA':
        return 'prioridad-baja';
      case 'MEDIA':
        return 'prioridad-media';
      case 'ALTA':
        return 'prioridad-alta';
      case 'URGENTE':
        return 'prioridad-urgente';
      default:
        return 'prioridad-media';
    }
  }

  getPercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  }

  asNumber(value: unknown): number {
    return Number(value) || 0;
  }
}


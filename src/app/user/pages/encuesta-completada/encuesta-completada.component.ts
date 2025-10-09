import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MessageService } from 'primeng/api';
import { RespuestaService, HistorialEncuesta } from '../../../core/services/respuesta/respuesta.service';

// Alias para mantener compatibilidad
type EncuestaCompletada = HistorialEncuesta;

@Component({
  selector: 'app-encuesta-completada',
  templateUrl: './encuesta-completada.component.html',
  styleUrls: ['./encuesta-completada.component.css']
})
export class EncuestaCompletadaComponent implements OnInit, OnDestroy {
  
  encuestasCompletadas: EncuestaCompletada[] = [];
  loading = false;
  searchText = '';
  currentPage = 1;
  pageSize = 10;
  totalEncuestas = 0;
  totalPages = 0;

  // Para mostrar detalles de una encuesta específica
  encuestaSeleccionada?: EncuestaCompletada;
  mostrarDetalles = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
    private respuestaService: RespuestaService
  ) {}

  ngOnInit(): void {
    // Verificar si venimos de una encuesta específica
    const encuestaId = this.route.snapshot.paramMap.get('id');
    if (encuestaId) {
      this.cargarDetalleEncuesta(+encuestaId);
    } else {
      this.cargarEncuestasCompletadas();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarEncuestasCompletadas(): void {
    this.loading = true;
    
    this.respuestaService.obtenerHistorialEncuestas(this.currentPage, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.ok && response.data && response.data.historial) {
            // Mapear las encuestas del backend al formato del frontend
            this.encuestasCompletadas = response.data.historial.map(encuesta => {
              return {
                id: encuesta.id,
                titulo: encuesta.titulo,
                descripcion: encuesta.descripcion,
                fecha_completada: new Date(encuesta.fecha_respuesta),
                tiempo_invertido: 0, // El backend no proporciona esto actualmente
                total_preguntas: encuesta.total_preguntas,
                total_respuestas: encuesta.respuestas?.length || 0,
                porcentaje_completado: 100, // Si está en historial, está completada
                estado: 'COMPLETADA' as const,
                puede_ver_resultados: true,
                fecha_inicio_encuesta: new Date(),
                fecha_fin_encuesta: new Date()
              };
            });
            this.totalEncuestas = response.data.total || 0;
            this.totalPages = response.data.totalPages || 0;
            
            console.log('Historial de encuestas cargado:', this.encuestasCompletadas);
          } else {
            // No hay datos o estructura inesperada
            this.encuestasCompletadas = [];
            this.totalEncuestas = 0;
            this.totalPages = 0;
            console.log('No hay historial de encuestas o estructura de datos inesperada');
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar encuestas completadas:', error);
          
          // Si es un error 404, significa que no hay historial aún
          if (error.status === 404) {
            this.encuestasCompletadas = [];
            this.totalEncuestas = 0;
            this.totalPages = 0;
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudieron cargar las encuestas completadas'
            });
          }
          this.loading = false;
        }
      });
  }

  cargarDetalleEncuesta(encuestaId: number): void {
    const encuesta = this.encuestasCompletadas.find(e => e.id === encuestaId);
    if (encuesta) {
      this.encuestaSeleccionada = encuesta;
      this.mostrarDetalles = true;
    } else {
      // Si no se encuentra, cargar desde el servicio
      this.cargarEncuestasCompletadas();
    }
  }

  get encuestasFiltradas(): EncuestaCompletada[] {
    if (!this.searchText) {
      return this.encuestasCompletadas;
    }
    
    return this.encuestasCompletadas.filter(encuesta => 
      encuesta.titulo.toLowerCase().includes(this.searchText.toLowerCase()) ||
      encuesta.descripcion.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  verDetalles(encuesta: EncuestaCompletada): void {
    this.encuestaSeleccionada = encuesta;
    this.mostrarDetalles = true;
  }

  volverALista(): void {
    this.mostrarDetalles = false;
    this.encuestaSeleccionada = undefined;
    this.router.navigate(['/user/encuesta-completada']);
  }

  onPageChange(event: any): void {
    this.currentPage = event.page + 1;
    this.pageSize = event.rows;
    // TODO: Si hay paginación del servidor, recargar datos
  }

  limpiarFiltro(): void {
    this.searchText = '';
  }

  actualizar(): void {
    this.cargarEncuestasCompletadas();
  }

  getSeverityClass(encuesta: EncuestaCompletada): string {
    return 'estado-completada';
  }

  getTiempoInvertidoTexto(minutos: number): string {
    if (minutos < 60) {
      return `${minutos} min`;
    }
    
    const horas = Math.floor(minutos / 60);
    const minutosRestantes = minutos % 60;
    
    if (minutosRestantes === 0) {
      return `${horas}h`;
    }
    
    return `${horas}h ${minutosRestantes}min`;
  }

  navegarAEncuestas(): void {
    this.router.navigate(['/user/view-encuestas']);
  }
}
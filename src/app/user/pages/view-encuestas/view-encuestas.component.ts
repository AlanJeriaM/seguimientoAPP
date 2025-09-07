import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MessageService } from 'primeng/api';
import { RespuestaService, EncuestaDisponible } from '../../../core/services/respuesta/respuesta.service';

@Component({
  selector: 'app-view-encuestas-user',
  templateUrl: './view-encuestas.component.html',
  styleUrls: ['./view-encuestas.component.css']
})
export class ViewEncuestasComponent implements OnInit, OnDestroy {
  
  encuestasDisponibles: EncuestaDisponible[] = [];
  loading = false;
  searchText = '';
  encuestaDestacada?: number; // ID de encuesta a destacar
  private destroy$ = new Subject<void>();

  // Estados para filtros
  estadoFiltro = 'TODAS';
  estados = [
    { label: 'Todas', value: 'TODAS' },
    { label: 'No iniciadas', value: 'NO_INICIADA' },
    { label: 'En progreso', value: 'EN_PROGRESO' },
    { label: 'Completadas', value: 'COMPLETADA' }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService,
    private respuestaService: RespuestaService
  ) {}

  ngOnInit(): void {
    // Verificar si hay query parameters para destacar una encuesta
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['encuesta_id']) {
        this.encuestaDestacada = +params['encuesta_id'];
      }
    });
    
    this.cargarEncuestasDisponibles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarEncuestasDisponibles(): void {
    this.loading = true;
    
    this.respuestaService.obtenerEncuestasDisponibles(1, 50, this.searchText)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.ok) {
            // Mapear las encuestas del backend al formato del frontend
            this.encuestasDisponibles = response.data.encuestas.map(encuesta => 
              this.respuestaService.mapearEncuestaDisponible(encuesta)
            );
            
            console.log('Encuestas cargadas:', this.encuestasDisponibles);
            
            // Limpiar destacado después de cargar
            this.limpiarDestacadoDespuesDeUnTiempo();
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar encuestas:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar las encuestas disponibles'
          });
          this.loading = false;
        }
      });
  }

  get encuestasFiltradas(): EncuestaDisponible[] {
    let filtradas = this.encuestasDisponibles;

    // Filtrar por texto de búsqueda
    if (this.searchText) {
      filtradas = filtradas.filter(encuesta => 
        encuesta.titulo.toLowerCase().includes(this.searchText.toLowerCase()) ||
        encuesta.descripcion.toLowerCase().includes(this.searchText.toLowerCase())
      );
    }

    // Filtrar por estado
    if (this.estadoFiltro !== 'TODAS') {
      filtradas = filtradas.filter(encuesta => 
        encuesta.estado_usuario === this.estadoFiltro
      );
    }

    return filtradas;
  }

  iniciarEncuesta(encuesta: EncuestaDisponible): void {
    if (encuesta.estado_usuario === 'COMPLETADA') {
      this.messageService.add({
        severity: 'info',
        summary: 'Información',
        detail: 'Esta encuesta ya ha sido completada'
      });
      return;
    }

    // Navegar al componente de responder encuesta
    this.router.navigate(['/user/responder-encuesta', encuesta.id]);
  }

  continuarEncuesta(encuesta: EncuestaDisponible): void {
    if (encuesta.estado_usuario !== 'EN_PROGRESO') {
      this.iniciarEncuesta(encuesta);
      return;
    }

    // Navegar al componente de responder encuesta con progreso guardado
    this.router.navigate(['/user/responder-encuesta', encuesta.id], {
      queryParams: { continuar: true }
    });
  }

  verResultados(encuesta: EncuestaDisponible): void {
    if (encuesta.estado_usuario !== 'COMPLETADA') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Debes completar la encuesta para ver los resultados'
      });
      return;
    }

    // Navegar a encuesta completada
    this.router.navigate(['/user/encuesta-completada', encuesta.id]);
  }

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'NO_INICIADA':
        return 'estado-no-iniciada';
      case 'EN_PROGRESO':
        return 'estado-en-progreso';
      case 'COMPLETADA':
        return 'estado-completada';
      default:
        return '';
    }
  }

  getEstadoLabel(estado: string): string {
    switch (estado) {
      case 'NO_INICIADA':
        return 'No iniciada';
      case 'EN_PROGRESO':
        return 'En progreso';
      case 'COMPLETADA':
        return 'Completada';
      default:
        return 'Desconocido';
    }
  }

  getBotonTexto(encuesta: EncuestaDisponible): string {
    switch (encuesta.estado_usuario) {
      case 'NO_INICIADA':
        return 'Iniciar';
      case 'EN_PROGRESO':
        return 'Continuar';
      case 'COMPLETADA':
        return 'Ver resultados';
      default:
        return 'Iniciar';
    }
  }

  getBotonIcono(encuesta: EncuestaDisponible): string {
    switch (encuesta.estado_usuario) {
      case 'NO_INICIADA':
        return 'pi pi-play';
      case 'EN_PROGRESO':
        return 'pi pi-forward';
      case 'COMPLETADA':
        return 'pi pi-eye';
      default:
        return 'pi pi-play';
    }
  }

  getBotonSeverity(encuesta: EncuestaDisponible): "success" | "info" | "help" | "primary" | "secondary" | "contrast" | "warning" | "danger" {
    switch (encuesta.estado_usuario) {
      case 'NO_INICIADA':
        return 'primary';
      case 'EN_PROGRESO':
        return 'warning';
      case 'COMPLETADA':
        return 'success';
      default:
        return 'primary';
    }
  }

  /**
   * Verifica si una encuesta debe ser destacada
   */
  isEncuestaDestacada(encuesta: EncuestaDisponible): boolean {
    return this.encuestaDestacada === encuesta.id;
  }

  /**
   * Limpia el destacado de la encuesta después de un tiempo
   */
  private limpiarDestacadoDespuesDeUnTiempo(): void {
    if (this.encuestaDestacada) {
      setTimeout(() => {
        this.encuestaDestacada = undefined;
        // Limpiar query params
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
      }, 5000); // 5 segundos
    }
  }
}
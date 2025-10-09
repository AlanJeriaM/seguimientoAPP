import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { EncuestaService, Encuesta } from '../../../core/services/encuesta/encuesta.service';
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-view-encuestas',
  templateUrl: './view-encuestas.component.html',
  styleUrls: ['./view-encuestas.component.css']
})
export class ViewEncuestasComponent implements OnInit, OnDestroy {
  encuestas: Encuesta[] = [];
  encuestasEliminadas: Encuesta[] = [];
  loading = false;
  loadingEliminadas = false;
  searchText = '';
  searchTextEliminadas = '';
  estadoFiltro = 'TODOS';
  currentPage = 1;
  currentPageEliminadas = 1;
  pageSize = 10;
  totalEncuestas = 0;
  totalEncuestasEliminadas = 0;
  totalPages = 0;
  totalPagesEliminadas = 0;
  totalEncuestasSistema = 0; // Total de encuestas en el sistema (sin filtros)
  displayDialog = false;
  displayDeleteDialog = false;
  displayDeletePermanentDialog = false;
  editMode = false;
  selectedEncuesta?: Encuesta;
  encuestaParaEliminar?: Encuesta;
  encuestaParaEliminarPermanente?: Encuesta;
  deleting = false;
  activeTabIndex = 0;

  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  estados = [
    { label: 'Todas', value: 'TODOS' },
    { label: 'Borrador', value: 'BORRADOR' },
    { label: 'Activa', value: 'ACTIVA' },
    { label: 'Próximamente', value: 'PROXIMAMENTE' },
    { label: 'Expirada', value: 'EXPIRADA' }
  ];

  constructor(
    private encuestaService: EncuestaService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarEncuestas();
    this.cargarEncuestasEliminadas();
    
    // Configurar búsqueda con debounce
    this.searchSubject$.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 1;
      this.cargarEncuestas();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubject$.complete();
  }

  cargarEncuestas(): void {
    this.loading = true;
    
    // Cargar encuestas con filtros
    this.encuestaService.obtenerEncuestas(
      this.currentPage,
      this.pageSize,
      this.estadoFiltro,
      this.searchText
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        if (response.ok) {
          this.encuestas = response.data.encuestas;
          this.totalEncuestas = response.data.total;
          this.totalPages = response.data.totalPages;
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: response.msj || 'Error al cargar las encuestas'
          });
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar encuestas:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error del servidor al cargar las encuestas'
        });
        this.loading = false;
      }
    });

    // Cargar total de encuestas del sistema (sin filtros) solo si hay filtros aplicados
    if (this.estadoFiltro !== 'TODOS' || this.searchText.trim() !== '') {
      this.encuestaService.obtenerEncuestas(
        1,
        1,
        'TODOS',
        ''
      ).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          if (response.ok) {
            this.totalEncuestasSistema = response.data.total;
          }
        },
        error: (error) => {
          console.error('Error al obtener total del sistema:', error);
        }
      });
    } else {
      // Si no hay filtros, el total del sistema es igual al total actual
      this.totalEncuestasSistema = this.totalEncuestas;
    }
  }

  cargarEncuestasEliminadas(): void {
    this.loadingEliminadas = true;
    this.encuestaService.obtenerEncuestasEliminadas(
      this.currentPageEliminadas,
      this.pageSize,
      this.searchTextEliminadas
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        if (response.ok) {
          this.encuestasEliminadas = response.data.encuestas;
          this.totalEncuestasEliminadas = response.data.total;
          this.totalPagesEliminadas = response.data.totalPages;
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: response.msj || 'Error al cargar las encuestas eliminadas'
          });
        }
        this.loadingEliminadas = false;
      },
      error: (error) => {
        console.error('Error al cargar encuestas eliminadas:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error del servidor al cargar las encuestas eliminadas'
        });
        this.loadingEliminadas = false;
      }
    });
  }

  buscarEncuestas(): void {
    // Emitir evento al Subject para aplicar debounce
    this.searchSubject$.next(this.searchText);
  }

  onEstadoChange(): void {
    // El cambio de estado debe ser inmediato, sin debounce
    this.currentPage = 1;
    this.cargarEncuestas();
  }

  limpiarFiltros(): void {
    this.searchText = '';
    this.estadoFiltro = 'TODOS';
    this.currentPage = 1;
    this.cargarEncuestas();
  }

  buscarEncuestasEliminadas(): void {
    this.currentPageEliminadas = 1;
    this.cargarEncuestasEliminadas();
  }

  limpiarFiltrosEliminadas(): void {
    this.searchTextEliminadas = '';
    this.currentPageEliminadas = 1;
    this.cargarEncuestasEliminadas();
  }

  onPageChange(event: any): void {
    this.currentPage = (event.page || 0) + 1;
    this.cargarEncuestas();
  }

  onPageChangeEliminadas(event: any): void {
    this.currentPageEliminadas = (event.page || 0) + 1;
    this.cargarEncuestasEliminadas();
  }

  actualizarDatos(): void {
    this.cargarEncuestas();
    this.cargarEncuestasEliminadas();
  }

  nuevaEncuesta(): void {
    this.router.navigate(['/admin/create-encuesta']);
  }

  editarEncuesta(encuesta: Encuesta): void {
    this.router.navigate(['/admin/editar-encuesta', encuesta.id]);
  }

  verEncuesta(encuesta: Encuesta): void {
    this.selectedEncuesta = encuesta;
    this.displayDialog = true;
  }

  eliminarEncuesta(encuesta: Encuesta): void {
    this.encuestaParaEliminar = encuesta;
    this.displayDeleteDialog = true;
  }

  confirmarEliminacion(): void {
    if (!this.encuestaParaEliminar) return;
    
    this.deleting = true;
    this.encuestaService.eliminarEncuesta(this.encuestaParaEliminar.id!).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.ok) {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: response.msj || 'Encuesta eliminada correctamente'
          });
          this.displayDeleteDialog = false;
          this.encuestaParaEliminar = undefined;
          this.cargarEncuestas();
          this.cargarEncuestasEliminadas();
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: response.msj || 'Error al eliminar la encuesta'
          });
        }
        this.deleting = false;
      },
      error: (error) => {
        console.error('Error al eliminar encuesta:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error del servidor al eliminar la encuesta'
        });
        this.deleting = false;
      }
    });
  }

  cancelarEliminacion(): void {
    this.displayDeleteDialog = false;
    this.encuestaParaEliminar = undefined;
  }

  // Getter para determinar si mostrar el botón "Crear Primera Encuesta"
  get mostrarCrearPrimeraEncuesta(): boolean {
    // Solo mostrar si realmente no hay encuestas en el sistema
    return this.totalEncuestasSistema === 0;
  }

  reactivarEncuesta(encuesta: Encuesta): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de que quieres reactivar la encuesta "${encuesta.titulo}"?`,
      header: 'Confirmar Reactivación',
      icon: 'pi pi-question-circle',
      accept: () => {
        this.encuestaService.reactivarEncuesta(encuesta.id!).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: (response) => {
            if (response.ok) {
              this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: response.msj || 'Encuesta reactivada correctamente'
              });
              this.cargarEncuestas();
              this.cargarEncuestasEliminadas();
            } else {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: response.msj || 'Error al reactivar la encuesta'
              });
            }
          },
          error: (error) => {
            console.error('Error al reactivar encuesta:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error del servidor al reactivar la encuesta'
            });
          }
        });
      }
    });
  }

  eliminarPermanentemente(encuesta: Encuesta): void {
    // Primero verificar si tiene respuestas
    this.encuestaService.eliminarEncuestaPermanentemente(encuesta.id!).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.ok) {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: response.msj || 'Encuesta eliminada permanentemente'
          });
          this.cargarEncuestasEliminadas();
        } else {
          // Si requiere confirmación debido a respuestas asociadas
          if (response.requiere_confirmacion && response.data) {
            this.confirmarEliminacionConRespuestas(encuesta, response.data);
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: response.msj || 'Error al eliminar permanentemente la encuesta'
            });
          }
        }
      },
      error: (error) => {
        console.error('Error al eliminar permanentemente encuesta:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error del servidor al eliminar permanentemente la encuesta'
        });
      }
    });
  }

  private confirmarEliminacionConRespuestas(encuesta: Encuesta, data: any): void {
    this.confirmationService.confirm({
      message: `⚠️ ADVERTENCIA: Esta encuesta tiene datos asociados.\n\n${data.mensaje_confirmacion}\n\n¿Deseas continuar con la eliminación permanente?`,
      header: 'Eliminación Permanente - Confirmar',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      acceptLabel: 'Sí, eliminar todo',
      rejectLabel: 'Cancelar',
      accept: () => {
        // Hacer la llamada con force_delete=true
        this.encuestaService.eliminarEncuestaPermanentemente(encuesta.id!, true).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: (response) => {
            if (response.ok) {
              this.messageService.add({
                severity: 'success',
                summary: 'Eliminación Completada',
                detail: response.msj || 'Encuesta y todos sus datos eliminados permanentemente'
              });
              this.cargarEncuestasEliminadas();
            } else {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: response.msj || 'Error en la eliminación'
              });
            }
          },
          error: (error) => {
            console.error('Error en eliminación forzada:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error del servidor en la eliminación'
            });
          }
        });
      }
    });
  }

  getEstadoBadgeClass(estado: string, encuesta?: Encuesta): string {
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
      // Solo si el estado es ACTIVA (no para BORRADOR, PAUSADA, etc.)
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

  getEstadoLabel(estado: string, encuesta?: Encuesta): string {
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

  /**
   * Verifica si una encuesta está expirada
   */
  isEncuestaExpirada(encuesta: Encuesta): boolean {
    if (!encuesta.fecha_fin) {
      return false; // Si no tiene fecha de fin, no está expirada
    }
    
    const fechaFin = new Date(encuesta.fecha_fin);
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999); // Fin del día actual
    
    return fechaFin < hoy;
  }

  cerrarDialog(): void {
    this.displayDialog = false;
    this.selectedEncuesta = undefined;
  }

  onTabChange(event: any): void {
    this.activeTabIndex = event.index;
  }
}

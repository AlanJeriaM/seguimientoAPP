import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
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
  estadoFiltro = 'TODOS';
  currentPage = 1;
  currentPageEliminadas = 1;
  pageSize = 10;
  totalEncuestas = 0;
  totalEncuestasEliminadas = 0;
  totalPages = 0;
  totalPagesEliminadas = 0;
  displayDialog = false;
  editMode = false;
  selectedEncuesta?: Encuesta;
  activeTabIndex = 0;

  private destroy$ = new Subject<void>();

  estados = [
    { label: 'Todas', value: 'TODOS' },
    { label: 'Borrador', value: 'BORRADOR' },
    { label: 'Activa', value: 'ACTIVA' },
    { label: 'Pausada', value: 'PAUSADA' },
    { label: 'Cerrada', value: 'CERRADA' }
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
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarEncuestas(): void {
    this.loading = true;
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
  }

  cargarEncuestasEliminadas(): void {
    this.loadingEliminadas = true;
    this.encuestaService.obtenerEncuestasEliminadas(
      this.currentPageEliminadas,
      this.pageSize
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
    this.currentPage = 1;
    this.cargarEncuestas();
  }

  limpiarFiltros(): void {
    this.searchText = '';
    this.estadoFiltro = 'TODOS';
    this.currentPage = 1;
    this.cargarEncuestas();
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
    this.confirmationService.confirm({
      message: `¿Estás seguro de que quieres eliminar la encuesta "${encuesta.titulo}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        // console.log('🗑️ Eliminando encuesta ID:', encuesta.id);
        this.encuestaService.eliminarEncuesta(encuesta.id!).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: (response) => {
            if (response.ok) {
              this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: response.msj || 'Encuesta eliminada correctamente'
              });
              this.cargarEncuestas();
              this.cargarEncuestasEliminadas();
            } else {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: response.msj || 'Error al eliminar la encuesta'
              });
            }
          },
          error: (error) => {
            console.error('Error al eliminar encuesta:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error del servidor al eliminar la encuesta'
            });
          }
        });
      }
    });
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

  getEstadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'BORRADOR':
        return 'estado-borrador';
      case 'ACTIVA':
        return 'estado-activa';
      case 'PAUSADA':
        return 'estado-pausada';
      case 'CERRADA':
        return 'estado-cerrada';
      default:
        return 'estado-borrador';
    }
  }

  getEstadoLabel(estado: string): string {
    switch (estado) {
      case 'BORRADOR':
        return 'Borrador';
      case 'ACTIVA':
        return 'Activa';
      case 'PAUSADA':
        return 'Pausada';
      case 'CERRADA':
        return 'Cerrada';
      default:
        return estado;
    }
  }

  cerrarDialog(): void {
    this.displayDialog = false;
    this.selectedEncuesta = undefined;
  }

  onTabChange(event: any): void {
    this.activeTabIndex = event.index;
  }
}

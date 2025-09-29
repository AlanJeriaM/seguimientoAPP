import { Component, OnInit, OnDestroy } from '@angular/core';
import { AdminService } from '../../../core/services/admin/admin.service';
import { TableLazyLoadEvent } from 'primeng/table';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-view-deleted-admin',
  templateUrl: './view-deleted-admin.component.html',
  styleUrls: ['./view-deleted-admin.component.css']
})
export class ViewDeletedAdminComponent implements OnInit, OnDestroy {

  administradoresEliminados: any[] = [];
  loading: boolean = false;
  totalRecords: number = 0;
  currentPage: number = 1;
  pageSize: number = 10;
  searchText: string = '';

  // Variables para el modal de reactivar administrador
  displayReactivateDialog: boolean = false;
  adminParaReactivar: any = null;
  reactivating: boolean = false;

  // Variables para el modal de eliminar permanentemente
  displayDeleteDialog: boolean = false;
  adminParaEliminar: any = null;
  deleting: boolean = false;
  confirmText: string = '';

  // Subject para manejar el debounce de búsqueda
  private searchSubject = new Subject<string>();

  constructor(
    private adminService: AdminService,
    private messageService: MessageService
  ) {
    // Configurar el debounce para la búsqueda
    this.searchSubject.pipe(
      debounceTime(500), // Esperar 500ms después de que el usuario deje de escribir
      distinctUntilChanged() // Solo proceder si el valor cambió
    ).subscribe(searchValue => {
      this.searchText = searchValue;
      this.cargarAdministradoresEliminados(1, searchValue);
    });
  }

  ngOnInit() {
    this.cargarAdministradoresEliminados();
  }

  ngOnDestroy() {
    // Completar el subject para evitar memory leaks
    this.searchSubject.complete();
  }

  cargarAdministradoresEliminados(page: number = 1, search: string = '') {
    this.loading = true;
    this.currentPage = page;
    this.searchText = search;

    this.adminService.obtenerAdministradoresEliminados(page, this.pageSize, search).subscribe({
      next: (resp) => {
        this.loading = false;
        if (resp.ok) {
          this.administradoresEliminados = resp.administradores || [];
          this.totalRecords = resp.total || 0;

          console.log('Administradores eliminados cargados:', this.administradoresEliminados.length);
          console.log('Total registros eliminados:', this.totalRecords);

          // Debug: mostrar datos de cada administrador eliminado
          this.administradoresEliminados.forEach((admin, index) => {
            console.log(`Admin eliminado ${index + 1}:`, {
              id: admin.id,
              nombre: admin.nombre_usuario,
              fecha_eliminacion: admin.fecha_eliminacion
            });
          });
        } else {
          console.error('Error:', resp.msj);
          this.administradoresEliminados = [];
          this.totalRecords = 0;
        }
      },
      error: (error) => {
        console.error('Error al cargar administradores eliminados:', error);
        this.loading = false;
        this.administradoresEliminados = [];
        this.totalRecords = 0;
      }
    });
  }

  // Método mejorado para la búsqueda con debounce
  buscarAdministradores(event: any) {
    const searchValue = event.target.value;
    // En lugar de llamar directamente a cargar datos, enviamos el valor al Subject
    this.searchSubject.next(searchValue);
  }

  limpiarFiltros() {
    this.searchText = '';
    const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.value = '';
    }
    // Limpiar también el subject y cargar datos limpios inmediatamente
    this.searchSubject.next('');
    this.cargarAdministradoresEliminados(1, '');
  }

  actualizarDatos() {
    this.cargarAdministradoresEliminados(this.currentPage, this.searchText);
  }

  reactivarAdministrador(admin: any) {
    this.adminParaReactivar = admin;
    this.displayReactivateDialog = true;
  }

  confirmarReactivacion() {
    if (!this.adminParaReactivar) return;
    
    this.reactivating = true;
    this.adminService.reactivarAdministrador(this.adminParaReactivar.id).subscribe({
      next: (resp) => {
        this.reactivating = false;
        if (resp.ok) {
          this.displayReactivateDialog = false;
          this.adminParaReactivar = null;
          this.cargarAdministradoresEliminados(this.currentPage, this.searchText);
          
          // Mostrar toast de éxito
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Administrador reactivado correctamente',
            life: 3000
          });
        } else {
          console.error('Error al reactivar administrador:', resp.msj);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: resp.msj || 'Error al reactivar administrador',
            life: 5000
          });
        }
      },
      error: (error) => {
        this.reactivating = false;
        console.error('Error de conexión:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error de conexión con el servidor',
          life: 5000
        });
      }
    });
  }

  cancelarReactivacion() {
    this.displayReactivateDialog = false;
    this.adminParaReactivar = null;
    this.reactivating = false;
  }

  eliminarPermanentemente(admin: any) {
    this.adminParaEliminar = admin;
    this.confirmText = '';
    this.displayDeleteDialog = true;
  }

  confirmarEliminacionPermanente() {
    if (!this.adminParaEliminar) return;
    
    // Validar que se escribió "ELIMINAR"
    if (this.confirmText !== 'ELIMINAR') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación requerida',
        detail: 'Debes escribir exactamente "ELIMINAR" para confirmar',
        life: 4000
      });
      return;
    }
    
    this.deleting = true;
    this.adminService.eliminarAdministradorPermanentemente(this.adminParaEliminar.id).subscribe({
      next: (resp) => {
        this.deleting = false;
        if (resp.ok) {
          this.displayDeleteDialog = false;
          this.adminParaEliminar = null;
          this.confirmText = '';
          this.cargarAdministradoresEliminados(this.currentPage, this.searchText);
          
          // Mostrar toast de éxito
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Administrador eliminado permanentemente',
            life: 3000
          });
        } else {
          console.error('Error al eliminar administrador:', resp.msj);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: resp.msj || 'Error al eliminar administrador',
            life: 5000
          });
        }
      },
      error: (error) => {
        this.deleting = false;
        console.error('Error de conexión:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error de conexión con el servidor',
          life: 5000
        });
      }
    });
  }

  cancelarEliminacionPermanente() {
    this.displayDeleteDialog = false;
    this.adminParaEliminar = null;
    this.confirmText = '';
    this.deleting = false;
  }


  // Manejo de paginación actualizado igual que en view-admin
  onPageChange(event: TableLazyLoadEvent) {
    console.log('Evento de paginación:', event);
    const page = ((event.first || 0) / (event.rows || this.pageSize)) + 1;
    this.cargarAdministradoresEliminados(page, this.searchText);
  }

  handleImageError(event: any) {
    console.log('Error cargando imagen:', event.target.src);
    event.target.src = 'assets/icons/user-default.png';
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../../core/services/auth/auth.service';
import { TableLazyLoadEvent } from 'primeng/table';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-view-deleted-users',
  templateUrl: './view-deleted-users.component.html',
  styleUrls: ['./view-deleted-users.component.css']
})
export class ViewDeletedUsersComponent implements OnInit, OnDestroy {

  usuariosEliminados: any[] = [];
  loading: boolean = false;
  totalRecords: number = 0;
  currentPage: number = 1;
  pageSize: number = 10;
  searchText: string = '';

  // Variables para el modal de reactivar usuario
  displayReactivateDialog: boolean = false;
  usuarioParaReactivar: any = null;
  reactivating: boolean = false;

  // Variables para el modal de eliminar permanentemente
  displayDeleteDialog: boolean = false;
  usuarioParaEliminar: any = null;
  deleting: boolean = false;
  confirmText: string = '';

  // Subject para manejar el debounce de búsqueda
  private searchSubject = new Subject<string>();

  constructor(
    private authService: AuthService,
    private messageService: MessageService
  ) {
    // Configurar el debounce para la búsqueda
    this.searchSubject.pipe(
      debounceTime(500), // Esperar 500ms después de que el usuario deje de escribir
      distinctUntilChanged() // Solo proceder si el valor cambió
    ).subscribe(searchValue => {
      this.searchText = searchValue;
      this.cargarUsuariosEliminados(1, searchValue);
    });
  }

  ngOnInit() {
    this.cargarUsuariosEliminados();
  }

  ngOnDestroy() {
    // Completar el subject para evitar memory leaks
    this.searchSubject.complete();
  }

  cargarUsuariosEliminados(page: number = 1, search: string = '') {
    this.loading = true;
    this.currentPage = page;
    this.searchText = search;

    this.authService.obtenerUsuariosEliminados(page, this.pageSize, search).subscribe({
      next: (resp) => {
        this.loading = false;
        if (resp.ok) {
          this.usuariosEliminados = resp.usuarios || [];
          this.totalRecords = resp.total || 0;

          console.log('Usuarios eliminados cargados:', this.usuariosEliminados.length);
          console.log('Total registros eliminados:', this.totalRecords);

          // Debug: mostrar datos de cada usuario eliminado
          this.usuariosEliminados.forEach((usuario, index) => {
            console.log(`Usuario eliminado ${index + 1}:`, {
              id: usuario.id,
              nombre: usuario.nombre,
              fecha_eliminacion: usuario.fecha_eliminacion
            });
          });
        } else {
          console.error('Error:', resp.msj);
          this.usuariosEliminados = [];
          this.totalRecords = 0;
        }
      },
      error: (error) => {
        console.error('Error al cargar usuarios eliminados:', error);
        this.loading = false;
        this.usuariosEliminados = [];
        this.totalRecords = 0;
      }
    });
  }

  // Método mejorado para la búsqueda con debounce
  buscarUsuarios(event: any) {
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
    this.cargarUsuariosEliminados(1, '');
  }

  actualizarDatos() {
    this.cargarUsuariosEliminados(this.currentPage, this.searchText);
  }

  reactivarUsuario(usuario: any) {
    this.usuarioParaReactivar = usuario;
    this.displayReactivateDialog = true;
  }

  confirmarReactivacion() {
    if (!this.usuarioParaReactivar) return;
    
    this.reactivating = true;
    this.authService.reactivarUsuario(this.usuarioParaReactivar.id).subscribe({
      next: (resp) => {
        this.reactivating = false;
        if (resp.ok) {
          this.displayReactivateDialog = false;
          this.usuarioParaReactivar = null;
          this.cargarUsuariosEliminados(this.currentPage, this.searchText);
          
          // Mostrar toast de éxito
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Usuario reactivado correctamente',
            life: 3000
          });
        } else {
          console.error('Error al reactivar usuario:', resp.msj);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: resp.msj || 'Error al reactivar usuario',
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
    this.usuarioParaReactivar = null;
    this.reactivating = false;
  }

  eliminarPermanentemente(usuario: any) {
    this.usuarioParaEliminar = usuario;
    this.confirmText = '';
    this.displayDeleteDialog = true;
  }

  confirmarEliminacionPermanente() {
    if (!this.usuarioParaEliminar) return;
    
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
    this.authService.eliminarUsuarioPermanentemente(this.usuarioParaEliminar.id).subscribe({
      next: (resp) => {
        this.deleting = false;
        if (resp.ok) {
          this.displayDeleteDialog = false;
          this.usuarioParaEliminar = null;
          this.confirmText = '';
          this.cargarUsuariosEliminados(this.currentPage, this.searchText);
          
          // Mostrar toast de éxito
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Usuario eliminado permanentemente',
            life: 3000
          });
        } else {
          console.error('Error al eliminar usuario:', resp.msj);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: resp.msj || 'Error al eliminar usuario',
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
    this.usuarioParaEliminar = null;
    this.confirmText = '';
    this.deleting = false;
  }


  // Manejo de paginación actualizado igual que en view-deleted-admin
  onPageChange(event: TableLazyLoadEvent) {
    console.log('Evento de paginación:', event);
    const page = ((event.first || 0) / (event.rows || this.pageSize)) + 1;
    this.cargarUsuariosEliminados(page, this.searchText);
  }

  handleImageError(event: any) {
    console.log('Error cargando imagen:', event.target.src);
    event.target.src = 'assets/icons/user-default.png';
  }
}

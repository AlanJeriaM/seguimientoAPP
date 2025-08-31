import { Component, OnInit, OnDestroy } from '@angular/core';
import { AdminService } from '../../../core/services/admin/admin.service';
import Swal from 'sweetalert2';
import { TableLazyLoadEvent } from 'primeng/table';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

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

  // Subject para manejar el debounce de búsqueda
  private searchSubject = new Subject<string>();

  constructor(private adminService: AdminService) {
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
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: resp.msj || 'Error al cargar administradores eliminados'
          });
        }
      },
      error: (error) => {
        console.error('Error al cargar administradores eliminados:', error);
        this.loading = false;
        this.administradoresEliminados = [];
        this.totalRecords = 0;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error de conexión con el servidor'
        });
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
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas reactivar al administrador ${admin.nombre_completo}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, reactivar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.reactivarAdministrador(admin.id).subscribe({
          next: (resp) => {
            if (resp.ok) {
              Swal.fire({
                icon: 'success',
                title: 'Administrador reactivado',
                text: 'El administrador ha sido reactivado correctamente',
                timer: 2000,
                showConfirmButton: false
              });
              this.cargarAdministradoresEliminados(this.currentPage, this.searchText);
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: resp.msj || 'Error al reactivar administrador'
              });
            }
          },
          error: (error) => {
            console.error('Error:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Error de conexión con el servidor'
            });
          }
        });
      }
    });
  }

  eliminarPermanentemente(admin: any) {
    Swal.fire({
      title: '¡ELIMINACIÓN PERMANENTE!',
      html: `
        <div style="text-align: center; margin: 20px 0;">
          <p><strong>¿Estás seguro que deseas eliminar permanentemente al administrador?</strong></p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Nombre:</strong> ${admin.nombre_completo}</p>
            <p><strong>Correo:</strong> ${admin.email_usuario}</p>
            <p><strong>Rol:</strong> ${admin.rol}</p>
          </div>
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px;">
            <p style="margin: 0; color: #856404;"><strong>ADVERTENCIA:</strong> Esta acción es IRREVERSIBLE.</p>
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        // Segundo diálogo de confirmación
        Swal.fire({
          title: 'Confirmación Final',
          text: '¿Realmente deseas eliminar? Escribe "ELIMINAR" para confirmar.',
          input: 'text',
          inputPlaceholder: 'Escribe ELIMINAR',
          showCancelButton: true,
          confirmButtonColor: '#dc3545',
          cancelButtonColor: '#6c757d',
          confirmButtonText: 'Eliminar',
          cancelButtonText: 'Cancelar',
          inputValidator: (value) => {
            if (value !== 'ELIMINAR') {
              return 'Debes escribir exactamente "ELIMINAR" para confirmar'
            }
            return null;
          }
        }).then((secondResult) => {
          if (secondResult.isConfirmed) {
            this.realizarEliminacionPermanente(admin);
          }
        });
      }
    });
  }

  private realizarEliminacionPermanente(admin: any) {
    // Mostrar loading
    Swal.fire({
      title: 'Eliminando administrador...',
      text: 'Por favor espera mientras se procesa la eliminación',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.adminService.eliminarAdministradorPermanentemente(admin.id).subscribe({
      next: (resp) => {
        if (resp.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Administrador eliminado permanentemente',
            html: `
              <div style="text-align: left;">
                <p><strong>${admin.nombre_completo}</strong> ha sido eliminado permanentemente del sistema.</p>
                <p><small>Esta acción no se puede deshacer.</small></p>
              </div>
            `,
            timer: 3000,
            showConfirmButton: true
          });

          // Recargar la lista de administradores eliminados
          this.cargarAdministradoresEliminados(this.currentPage, this.searchText);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error al eliminar',
            text: resp.msj || 'Error al eliminar administrador permanentemente'
          });
        }
      },
      error: (error) => {
        console.error('Error:', error);
        // Manejar diferentes tipos de errores
        let mensajeError = 'Error de conexión con el servidor';

        if (error.status === 400) {
          mensajeError = error.error?.msj || 'Datos inválidos';
        } else if (error.status === 404) {
          mensajeError = error.error?.msj || 'Administrador no encontrado';
        } else if (error.status === 500) {
          mensajeError = error.error?.msj || 'Error interno del servidor';
        }

        Swal.fire({
          icon: 'error',
          title: 'Error de conexión',
          text: mensajeError,
          confirmButtonText: 'Entendido'
        });
      }
    });
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

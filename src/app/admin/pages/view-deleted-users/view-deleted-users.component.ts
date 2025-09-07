import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../../core/services/auth/auth.service';
import Swal from 'sweetalert2';
import { TableLazyLoadEvent } from 'primeng/table';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

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

  // Subject para manejar el debounce de búsqueda
  private searchSubject = new Subject<string>();

  constructor(private authService: AuthService) {
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
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: resp.msj || 'Error al cargar usuarios eliminados'
          });
        }
      },
      error: (error) => {
        console.error('Error al cargar usuarios eliminados:', error);
        this.loading = false;
        this.usuariosEliminados = [];
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
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas reactivar al usuario ${usuario.nombre}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, reactivar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.reactivarUsuario(usuario.id).subscribe({
          next: (resp) => {
            if (resp.ok) {
              Swal.fire({
                icon: 'success',
                title: 'Usuario reactivado',
                text: 'El usuario ha sido reactivado correctamente',
                timer: 2000,
                showConfirmButton: false
              });
              this.cargarUsuariosEliminados(this.currentPage, this.searchText);
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: resp.msj || 'Error al reactivar usuario'
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

  eliminarPermanentemente(usuario: any) {
    Swal.fire({
      title: '¡ELIMINACIÓN PERMANENTE!',
      html: `
        <div style="text-align: center; margin: 20px 0;">
          <p><strong>¿Estás seguro que deseas eliminar permanentemente al usuario?</strong></p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Nombre:</strong> ${usuario.nombre}</p>
            <p><strong>Correo:</strong> ${usuario.correo}</p>
            <p><strong>Empresa:</strong> ${usuario.empresa_actual || 'Sin empresa'}</p>
          </div>
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px;">
            <p style="margin: 0; color: #856404;"><strong>ADVERTENCIA:</strong> Esta acción no se puede deshacer</p>
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
            this.realizarEliminacionPermanente(usuario);
          }
        });
      }
    });
  }

  private realizarEliminacionPermanente(usuario: any) {
    // Mostrar loading
    Swal.fire({
      title: 'Eliminando usuario...',
      text: 'Por favor espera mientras se procesa la eliminación',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.authService.eliminarUsuarioPermanentemente(usuario.id).subscribe({
      next: (resp) => {
        if (resp.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Usuario eliminado permanentemente',
            html: `
              <div style="text-align: left;">
                <p><strong>${usuario.nombre}</strong> ha sido eliminado correctamente del sistema</p>
              </div>
            `,
            timer: 3000,
            showConfirmButton: true
          });

          // Recargar la lista de usuarios eliminados
          this.cargarUsuariosEliminados(this.currentPage, this.searchText);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error al eliminar',
            text: resp.msj || 'Error al eliminar usuario permanentemente'
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
          mensajeError = error.error?.msj || 'Usuario no encontrado';
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

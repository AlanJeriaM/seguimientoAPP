import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-view-deleted-users',
  templateUrl: './view-deleted-users.component.html',
  styleUrls: ['./view-deleted-users.component.css']
})
export class ViewDeletedUsersComponent implements OnInit {

  usuariosEliminados: any[] = [];
  loading: boolean = false;
  totalRecords: number = 0;
  currentPage: number = 1;
  pageSize: number = 10;
  searchText: string = '';

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.cargarUsuariosEliminados();
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

  buscarUsuarios(event: any) {
    const searchValue = event.target.value;
    this.cargarUsuariosEliminados(1, searchValue);
  }

  limpiarFiltros() {
    this.searchText = '';
    const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.value = '';
    }
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
            <p style="margin: 0; color: #856404;"><strong>ADVERTENCIA:</strong> Esta acción es IRREVERSIBLE.
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      focusCancel: true,
      reverseButtons: true,
      showClass: {
        popup: 'animate__animated animate__fadeInDown'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp'
      }
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
          confirmButtonText: 'Confirmar',
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
              <div style="text-align: center;">
                <p><strong>${usuario.nombre}</strong> ha sido eliminado permanentemente del sistema.</p>
                <p><small>Esta acción no se puede deshacer</small></p>
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
        Swal.fire({
          icon: 'error',
          title: 'Error de conexión',
          text: 'No se pudo conectar con el servidor. Inténtalo de nuevo.'
        });
      }
    });
  }

  onPageChange(event: any) {
    const page = (event.first / event.rows) + 1;
    this.cargarUsuariosEliminados(page, this.searchText);
  }

  handleImageError(event: any) {
    console.log('Error cargando imagen:', event.target.src);
    event.target.src = 'assets/icons/user-default.png';
  }
}

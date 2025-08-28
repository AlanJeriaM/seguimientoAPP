import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../core/services/admin/admin.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-view-deleted-admin',
  templateUrl: './view-deleted-admin.component.html',
  styleUrls: ['./view-deleted-admin.component.css']
})
export class ViewDeletedAdminComponent implements OnInit {

  administradoresEliminados: any[] = [];
  loading: boolean = false;
  totalRecords: number = 0;
  currentPage: number = 1;
  pageSize: number = 10;
  searchText: string = '';

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.cargarAdministradoresEliminados();
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

  buscarAdministradores(event: any) {
    const searchValue = event.target.value;
    this.cargarAdministradoresEliminados(1, searchValue);
  }

  limpiarFiltros() {
    this.searchText = '';
    const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.value = '';
    }
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
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      focusCancel: true,
      reverseButtons: true
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
    this.cargarAdministradoresEliminados(page, this.searchText);
  }

  handleImageError(event: any) {
    console.log('Error cargando imagen:', event.target.src);
    event.target.src = 'assets/icons/user-default.png';
  }
}

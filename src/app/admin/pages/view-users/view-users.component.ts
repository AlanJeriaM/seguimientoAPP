import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth/auth.service';
import Swal from 'sweetalert2';
import { TableLazyLoadEvent } from 'primeng/table';

@Component({
  selector: 'app-view-users',
  templateUrl: './view-users.component.html',
  styleUrls: ['./view-users.component.css']
})
export class ViewUsersComponent implements OnInit {

  usuarios: any[] = [];
  loading: boolean = false;
  totalRecords: number = 0;
  currentPage: number = 1;
  pageSize: number = 10;
  searchText: string = '';

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios(page: number = 1, search: string = '') {
    this.loading = true;
    this.currentPage = page;
    this.searchText = search;

    this.authService.obtenerUsuarios(page, this.pageSize, search).subscribe({
      next: (resp) => {
        this.loading = false;
        if (resp.ok) {
          this.usuarios = resp.usuarios || [];
          this.totalRecords = resp.total || 0;

          console.log('Usuarios cargados:', this.usuarios.length);
          console.log('Total registros:', this.totalRecords);
        } else {
          console.error('Error:', resp.msj);
          this.usuarios = [];
          this.totalRecords = 0;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: resp.msj || 'Error al cargar usuarios'
          });
        }
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.loading = false;
        this.usuarios = [];
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
    this.cargarUsuarios(1, searchValue);
  }

  limpiarFiltros() {
    this.searchText = '';
    const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.value = '';
    }
    this.cargarUsuarios(1, '');
  }

  actualizarDatos() {
    this.cargarUsuarios(this.currentPage, this.searchText);
  }

  eliminarUsuario(usuario: any) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas desactivar al usuario ${usuario.nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.desactivarUsuario(usuario.id).subscribe({
          next: (resp) => {
            if (resp.ok) {
              Swal.fire({
                icon: 'success',
                title: 'Usuario desactivado',
                text: 'El usuario ha sido desactivado correctamente',
                timer: 2000,
                showConfirmButton: false
              });
              this.cargarUsuarios(this.currentPage, this.searchText);
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: resp.msj || 'Error al desactivar usuario'
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

  verUsuario(usuario: any) {
    // Implementar vista detallada del usuario
    console.log('Ver usuario:', usuario);
  }

  editarUsuario(usuario: any) {
    // Implementar edición de usuario
    console.log('Editar usuario:', usuario);
  }

  onPageChange(event: TableLazyLoadEvent) {
    console.log('Evento de paginación:', event);
    const page = ((event.first || 0) / (event.rows || this.pageSize)) + 1;
    this.cargarUsuarios(page, this.searchText);
  }

  handleImageError(event: any) {
    console.log('Error cargando imagen:', event.target.src);
    event.target.src = 'assets/icons/user-default.png';
  }
}

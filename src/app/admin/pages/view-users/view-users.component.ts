import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth/auth.service';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { TableLazyLoadEvent } from 'primeng/table';

@Component({
  selector: 'app-view-users',
  templateUrl: './view-users.component.html',
  styleUrls: ['./view-users.component.css']
})
export class ViewUsersComponent implements OnInit, OnDestroy {

  usuarios: any[] = [];
  loading: boolean = false;
  totalRecords: number = 0;
  currentPage: number = 1;
  pageSize: number = 10;
  searchText: string = '';
  displayDialog: boolean = false;
  displayEditDialog: boolean = false;
  selectedUser?: any;
  usuarioParaEditar?: any;
  userForm!: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private messageService: MessageService,
    private formBuilder: FormBuilder
  ) {
    this.inicializarFormulario();
  }

  ngOnInit() {
    this.cargarUsuarios();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  inicializarFormulario(): void {
    this.userForm = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      correo: ['', [Validators.required, Validators.email]],
      empresa_actual: [''],
      posicion_actual: [''],
      ubicacion: [''],
      industria: ['']
    });
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
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      customClass: {
        actions: 'my-swal-actions'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.desactivarUsuario(usuario.id).subscribe({
          next: (resp) => {
            if (resp.ok) {
              Swal.fire({
                icon: 'success',
                title: 'Usuario eliminado',
                text: 'El usuario ha sido eliminado correctamente',
                timer: 2000,
                showConfirmButton: false
              });
              this.cargarUsuarios(this.currentPage, this.searchText);
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: resp.msj || 'Error al eliminar usuario'
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

  verUsuario(usuario: any): void {
    this.selectedUser = { ...usuario };
    this.displayDialog = true;
  }

  editarUsuario(usuario: any): void {
    this.usuarioParaEditar = { ...usuario };
    this.displayEditDialog = true;
  }


  cancelarDialog(): void {
    this.displayDialog = false;
    this.selectedUser = undefined;
    this.userForm.reset();
    this.inicializarFormulario();
  }

  onUsuarioActualizado(usuarioActualizado: any) {
    // Actualizar el usuario en la lista local
    const index = this.usuarios.findIndex(u => u.id === usuarioActualizado.id);
    if (index !== -1) {
      this.usuarios[index] = { ...this.usuarios[index], ...usuarioActualizado };
    }
    
    // Cerrar el diálogo de edición
    this.displayEditDialog = false;
    this.usuarioParaEditar = undefined;
    
    // Mostrar mensaje de éxito
    this.messageService.add({
      severity: 'success',
      summary: 'Usuario actualizado',
      detail: 'El usuario ha sido actualizado correctamente'
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return 'Este campo es requerido';
      }
      if (field.errors['email']) {
        return 'Ingrese un correo válido';
      }
      if (field.errors['minlength']) {
        return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      }
    }
    return '';
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

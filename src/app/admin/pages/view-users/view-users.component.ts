import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth/auth.service';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
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

  // Variables para el modal de eliminar usuario
  displayDeleteDialog: boolean = false;
  usuarioParaEliminar: any = null;
  deleting: boolean = false;

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
        }
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.loading = false;
        this.usuarios = [];
        this.totalRecords = 0;
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
    this.usuarioParaEliminar = usuario;
    this.displayDeleteDialog = true;
  }

  confirmarEliminacion() {
    if (!this.usuarioParaEliminar) return;
    
    this.deleting = true;
    this.authService.desactivarUsuario(this.usuarioParaEliminar.id).subscribe({
      next: (resp) => {
        this.deleting = false;
        if (resp.ok) {
          this.displayDeleteDialog = false;
          this.usuarioParaEliminar = null;
          this.cargarUsuarios(this.currentPage, this.searchText);
          
          // Mostrar toast de éxito
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Usuario eliminado correctamente',
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

  cancelarEliminacion() {
    this.displayDeleteDialog = false;
    this.usuarioParaEliminar = null;
    this.deleting = false;
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

  hasPersonalizedOptions(user: any): boolean {
    return !!(user.opciones_personalizadas_educacion?.length || 
              user.opciones_personalizadas_tecnologias?.length || 
              user.opciones_personalizadas_area_interes?.length || 
              user.opciones_personalizadas_industria?.length);
  }

  cerrarDialog() {
    this.displayDialog = false;
    this.selectedUser = undefined;
  }
}

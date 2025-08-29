import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin/admin.service';
import Swal from 'sweetalert2';
import { TableLazyLoadEvent } from 'primeng/table';
import { CustomValidators } from '../../../core/validations/contrasenia-validator.service.ts/validator-contrasenia';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-view-admin',
  templateUrl: './view-admin.component.html',
  styleUrls: ['./view-admin.component.css']
})
export class ViewAdminComponent implements OnInit, OnDestroy {

  private emailPattern: string = "^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$";
  administradores: any[] = [];
  loading: boolean = false;
  totalRecords: number = 0;
  currentPage: number = 1;
  pageSize: number = 10;
  searchText: string = '';

  // Variables para el diálogo de crear/editar administrador
  displayDialog: boolean = false;
  editMode: boolean = false;
  adminForm!: FormGroup;
  selectedAdmin: any = null;

  private passwordSubscription?: Subscription;

  constructor(
    private adminService: AdminService,
    private formBuilder: FormBuilder
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    this.cargarAdministradores();
  }

  ngOnDestroy() {
    if (this.passwordSubscription) {
      this.passwordSubscription.unsubscribe();
    }
  }

  // Inicializar el formulario reactivo
  initializeForm() {
    this.adminForm = this.formBuilder.group({
      nombre_usuario: ['', [Validators.required]],
      apellido: ['', [Validators.required]],
      email_usuario: ['', [Validators.required, Validators.pattern(this.emailPattern)]],
      contrasenia: ['', [Validators.required]],
      confirmarContrasenia: ['', [Validators.required]],
    }, {
      validators: CustomValidators.passwordMatchValidator('contrasenia', 'confirmarContrasenia')
    });
  }

  cargarAdministradores(page: number = 1, search: string = '') {
    this.loading = true;
    this.currentPage = page;
    this.searchText = search;

    this.adminService.obtenerAdministradores(page, this.pageSize, search).subscribe({
      next: (resp) => {
        this.loading = false;
        if (resp.ok) {
          this.administradores = resp.administradores || [];
          this.totalRecords = resp.total || 0;

          console.log('Administradores cargados:', this.administradores.length);
          console.log('Total registros:', this.totalRecords);

          // Debug: mostrar datos de cada administrador
          this.administradores.forEach((admin, index) => {
            console.log(`Admin ${index + 1}:`, {
              id: admin.id,
              nombre: admin.nombre_usuario,
              fecha_registro: admin.fecha_registro,
              // ultimo_acceso: admin.ultimo_acceso
            });
          });
        } else {
          console.error('Error:', resp.msj);
          this.administradores = [];
          this.totalRecords = 0;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: resp.msj || 'Error al cargar administradores'
          });
        }
      },
      error: (error) => {
        console.error('Error al cargar administradores:', error);
        this.loading = false;
        this.administradores = [];
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
    this.cargarAdministradores(1, searchValue);
  }

  limpiarFiltros() {
    this.searchText = '';
    const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.value = '';
    }
    this.cargarAdministradores(1, '');
  }

  actualizarDatos() {
    this.cargarAdministradores(this.currentPage, this.searchText);
  }

  // Abrir diálogo para crear nuevo administrador
  nuevoAdministrador() {
    this.editMode = false;
    this.selectedAdmin = null;

    // Limpiar subscription anterior si existe
    if (this.passwordSubscription) {
      this.passwordSubscription.unsubscribe();
    }

    // Reset del formulario
    this.adminForm.reset();

    // Limpiar validadores primero
    this.adminForm.get('nombre_usuario')?.clearValidators();
    this.adminForm.get('apellido')?.clearValidators();
    this.adminForm.get('email_usuario')?.clearValidators();
    this.adminForm.get('contrasenia')?.clearValidators();
    this.adminForm.get('confirmarContrasenia')?.clearValidators();
    this.adminForm.clearValidators();

    // Configuración de validaciones para nuevo administrador
    this.adminForm.get('nombre_usuario')?.setValidators([Validators.required]);
    this.adminForm.get('apellido')?.setValidators([Validators.required]);
    this.adminForm.get('email_usuario')?.setValidators([Validators.required, Validators.pattern(this.emailPattern)]);
    this.adminForm.get('contrasenia')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.adminForm.get('confirmarContrasenia')?.setValidators([Validators.required]);

    // Usar nuestro validador personalizado para modo crear
    this.adminForm.setValidators(this.passwordMatchValidatorForCreate('contrasenia', 'confirmarContrasenia'));

    this.adminForm.updateValueAndValidity();
    this.displayDialog = true;
  }

  // Validador para modo CREAR - ambas contraseñas son obligatorias
  passwordMatchValidatorForCreate(password: string, confirmPassword: string) {
    return (control: AbstractControl) => {
      const formGroup = control as FormGroup;
      const passwordControl = formGroup.get(password);
      const confirmPasswordControl = formGroup.get(confirmPassword);

      if (!passwordControl || !confirmPasswordControl) {
        return null;
      }

      const passwordValue = passwordControl.value;
      const confirmPasswordValue = confirmPasswordControl.value;

      // En modo crear, ambos campos son obligatorios
      if (!passwordValue || !confirmPasswordValue) {
        // Si algún campo está vacío, marcar error en confirmarContrasenia
        if (!confirmPasswordValue) {
          confirmPasswordControl.setErrors({
            ...(confirmPasswordControl.errors || {}),
            required: true
          });
        }
        return { passwordRequired: true };
      }

      // Si ambos tienen valores, verificar que coincidan
      if (passwordValue !== confirmPasswordValue) {
        confirmPasswordControl.setErrors({
          ...(confirmPasswordControl.errors || {}),
          mismatch: true
        });
        return { mismatch: true };
      } else {
        // Limpiar errores de mismatch si las contraseñas coinciden
        if (confirmPasswordControl.errors?.['mismatch']) {
          const newErrors = { ...confirmPasswordControl.errors };
          delete newErrors['mismatch'];
          if (Object.keys(newErrors).length === 0) {
            confirmPasswordControl.setErrors(null);
          } else {
            confirmPasswordControl.setErrors(newErrors);
          }
        }
      }

      return null;
    };
  }

  // Validador para modo EDITAR - contraseñas opcionales pero si se llenan deben coincidir
  passwordMatchValidatorForEdit(password: string, confirmPassword: string, isEditMode: boolean) {
    return (control: AbstractControl) => {
      const formGroup = control as FormGroup;
      const passwordControl = formGroup.get(password);
      const confirmPasswordControl = formGroup.get(confirmPassword);

      if (!passwordControl || !confirmPasswordControl) {
        return null;
      }

      const passwordValue = passwordControl.value;
      const confirmPasswordValue = confirmPasswordControl.value;

      // En modo edición, si no hay contraseña, no validar
      if (!passwordValue && !confirmPasswordValue) {
        // Limpiar errores si ambos están vacíos
        if (confirmPasswordControl.errors?.['required']) {
          const newErrors = { ...confirmPasswordControl.errors };
          delete newErrors['required'];
          if (Object.keys(newErrors).length === 0) {
            confirmPasswordControl.setErrors(null);
          } else {
            confirmPasswordControl.setErrors(newErrors);
          }
        }
        return null;
      }

      // Si hay contraseña pero no confirmación
      if (passwordValue && !confirmPasswordValue) {
        confirmPasswordControl.setErrors({
          ...(confirmPasswordControl.errors || {}),
          required: true
        });
        return { confirmPasswordRequired: true };
      }

      // Si ambos tienen valores, verificar que coincidan
      if (passwordValue && confirmPasswordValue && passwordValue !== confirmPasswordValue) {
        confirmPasswordControl.setErrors({
          ...(confirmPasswordControl.errors || {}),
          mismatch: true
        });
        return { mismatch: true };
      }

      // Si llegamos aquí, todo está bien - limpiar errores
      if (confirmPasswordControl.errors) {
        const newErrors = { ...confirmPasswordControl.errors };
        delete newErrors['mismatch'];
        delete newErrors['required'];
        if (Object.keys(newErrors).length === 0) {
          confirmPasswordControl.setErrors(null);
        } else {
          confirmPasswordControl.setErrors(newErrors);
        }
      }

      return null;
    };
  }

  // Abrir diálogo para editar administrador
  editarAdministrador(admin: any) {
    this.editMode = true;
    this.selectedAdmin = admin;

    // Limpiar subscription anterior si existe
    if (this.passwordSubscription) {
      this.passwordSubscription.unsubscribe();
    }

    // Limpiar todos los validadores primero
    this.adminForm.get('nombre_usuario')?.clearValidators();
    this.adminForm.get('apellido')?.clearValidators();
    this.adminForm.get('email_usuario')?.clearValidators();
    this.adminForm.get('contrasenia')?.clearValidators();
    this.adminForm.get('confirmarContrasenia')?.clearValidators();

    // Configurar validaciones para edición
    this.adminForm.get('nombre_usuario')?.setValidators([Validators.required]);
    this.adminForm.get('apellido')?.setValidators([Validators.required]);
    this.adminForm.get('email_usuario')?.setValidators([Validators.required, Validators.pattern(this.emailPattern)]);
    this.adminForm.get('contrasenia')?.setValidators([Validators.minLength(6)]);
    // No agregar required a confirmarContrasenia inicialmente

    // Remover el validador personalizado del FormGroup y agregar el validador dinámico para edición
    this.adminForm.clearValidators();
    this.adminForm.setValidators(this.passwordMatchValidatorForEdit('contrasenia', 'confirmarContrasenia', true));

    // Cargar datos del administrador en el formulario
    this.adminForm.patchValue({
      nombre_usuario: admin.nombre_usuario || '',
      apellido: admin.apellido || '',
      email_usuario: admin.email_usuario || '',
      contrasenia: '',
      confirmarContrasenia: ''
    });

    // Agregar listener para validación dinámica cuando cambie la contraseña
    this.passwordSubscription = this.adminForm.get('contrasenia')?.valueChanges.subscribe(value => {
      if (value) {
        // Si hay contraseña, agregar validador required a confirmarContrasenia
        this.adminForm.get('confirmarContrasenia')?.setValidators([Validators.required]);
      } else {
        // Si no hay contraseña, limpiar validadores de confirmarContrasenia
        this.adminForm.get('confirmarContrasenia')?.clearValidators();
        this.adminForm.get('confirmarContrasenia')?.setValue('');
      }
      this.adminForm.get('confirmarContrasenia')?.updateValueAndValidity();
    });

    this.adminForm.updateValueAndValidity();
    this.displayDialog = true;
  }

  // Método para verificar si el formulario está válido según el modo
  isFormValid(): boolean {
    if (!this.editMode) {
      // Modo crear: verificar que todos los campos requeridos estén llenos
      const nombre = this.adminForm.get('nombre_usuario')?.value?.trim();
      const apellido = this.adminForm.get('apellido')?.value?.trim();
      const email = this.adminForm.get('email_usuario')?.value?.trim();
      const contrasenia = this.adminForm.get('contrasenia')?.value?.trim();
      const confirmarContrasenia = this.adminForm.get('confirmarContrasenia')?.value?.trim();

      // Verificar que todos los campos estén llenos
      if (!nombre || !apellido || !email || !contrasenia || !confirmarContrasenia) {
        return false;
      }

      // Verificar que las contraseñas coincidan
      if (contrasenia !== confirmarContrasenia) {
        return false;
      }

      // Verificar validaciones adicionales del formulario
      return this.adminForm.valid;
    } else {
      // Modo editar: verificar campos básicos y contraseñas si se proporcionan
      const nombre = this.adminForm.get('nombre_usuario')?.value?.trim();
      const apellido = this.adminForm.get('apellido')?.value?.trim();
      const email = this.adminForm.get('email_usuario')?.value?.trim();

      // Campos básicos son requeridos
      if (!nombre || !apellido || !email) {
        return false;
      }

      // Si hay contraseña, debe tener confirmación y coincidir
      const contrasenia = this.adminForm.get('contrasenia')?.value?.trim();
      const confirmarContrasenia = this.adminForm.get('confirmarContrasenia')?.value?.trim();

      if (contrasenia) {
        if (!confirmarContrasenia || contrasenia !== confirmarContrasenia) {
          return false;
        }
      }

      return this.adminForm.valid;
    }
  }

  // Guardar administrador (crear o actualizar)
  guardarAdministrador() {
    // Marcar todos los campos como tocados para mostrar errores
    this.adminForm.markAllAsTouched();

    // Validación del formulario
    if (!this.isFormValid()) {
      Swal.fire({
        icon: 'warning',
        title: 'Formulario inválido',
        text: 'Por favor, complete todos los campos requeridos correctamente'
      });
      return;
    }

    const adminData = { ...this.adminForm.value };

    // Limpiar campos que no se envían al backend
    delete adminData.confirmarContrasenia;

    // Si es edición y no se proporcionó contraseña, no enviarla
    if (this.editMode && !adminData.contrasenia) {
      delete adminData.contrasenia;
    }

    if (this.editMode) {
      // Actualizar administrador existente
      this.adminService.actualizarAdministrador(this.selectedAdmin.id, adminData).subscribe({
        next: (resp) => {
          if (resp.ok) {
            Swal.fire({
              icon: 'success',
              title: 'Administrador actualizado',
              text: 'Los datos han sido actualizados correctamente',
              timer: 2000,
              showConfirmButton: false
            });
            this.displayDialog = false;
            this.cargarAdministradores(this.currentPage, this.searchText);
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: resp.msj || 'Error al actualizar administrador'
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
    } else {
      // Crear nuevo administrador
      this.adminService.crearAdministrador(adminData).subscribe({
        next: (resp) => {
          if (resp.ok) {
            Swal.fire({
              icon: 'success',
              title: 'Administrador creado',
              text: 'El nuevo administrador ha sido creado correctamente',
              timer: 2000,
              showConfirmButton: false
            });
            this.displayDialog = false;
            this.cargarAdministradores(this.currentPage, this.searchText);
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error al crear administrador',
              text: resp.msj || 'Error al crear administrador',
              confirmButtonText: 'Entendido'
            });
          }
        },
        error: (error) => {
          console.error('Error completo:', error);

          // Manejar diferentes tipos de errores
          let mensajeError = 'Error de conexión con el servidor';

          if (error.status === 400) {
            mensajeError = error.error?.msj || 'Datos inválidos';
          } else if (error.status === 409) {
            mensajeError = error.error?.msj || 'Ya existe un administrador con este correo';
          } else if (error.status === 500) {
            mensajeError = error.error?.msj || 'Error interno del servidor';
          }

          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: mensajeError,
            confirmButtonText: 'Entendido'
          });
        }
      });
    }
  }

  eliminarAdministrador(admin: any) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar al administrador ${admin.nombre_completo}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.desactivarAdministrador(admin.id).subscribe({
          next: (resp) => {
            if (resp.ok) {
              Swal.fire({
                icon: 'success',
                title: 'Administrador eliminado',
                text: 'El administrador ha sido eliminado correctamente',
                timer: 2000,
                showConfirmButton: false
              });
              this.cargarAdministradores(this.currentPage, this.searchText);
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: resp.msj || 'Error al eliminar administrador'
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

  verAdministrador(admin: any) {
    Swal.fire({
      title: 'Información del Administrador',
      html: `
        <div style="text-align: left;">
          <p><strong>Nombre:</strong> ${admin.nombre_completo}</p>
          <p><strong>Correo:</strong> ${admin.email_usuario}</p>
          <p><strong>Rol:</strong> ${admin.rol}</p>
          <p><strong>Fecha de registro:</strong> ${new Date(admin.fecha_registro).toLocaleDateString('es-ES')}</p>
        </div>
      `,
      icon: 'info',
      confirmButtonColor: '#17a2b8',
      confirmButtonText: 'Cerrar'
    });
  }

  onPageChange(event: TableLazyLoadEvent) {
    console.log('Evento de paginación:', event);
    const page = ((event.first || 0) / (event.rows || this.pageSize)) + 1;
    this.cargarAdministradores(page, this.searchText);
  }

  handleImageError(event: any) {
    console.log('Error cargando imagen:', event.target.src);
    event.target.src = 'assets/icons/user-default.png';
  }

  // Cerrar diálogo
  cancelarDialog() {
    this.displayDialog = false;
    // Limpiar subscription cuando se cierre el diálogo
    if (this.passwordSubscription) {
      this.passwordSubscription.unsubscribe();
    }
  }

  // Métodos auxiliares para validaciones en el template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.adminForm.get(fieldName);
    return !!(field?.invalid && (field?.dirty || field?.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.adminForm.get(fieldName);

    if (field?.errors) {
      if (field.errors['required']) {
        return 'Este campo es requerido';
      }
      if (field.errors['email'] || field.errors['pattern']) {
        return 'Ingrese un correo electrónico válido';
      }
      if (field.errors['minlength']) {
        return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      }
      if (field.errors['mismatch']) {
        return 'Las contraseñas no coinciden';
      }
    }

    // Verificar errores del FormGroup solo si no hay errores específicos del campo
    if (!field?.errors) {
      const formErrors = this.adminForm.errors;
      if (formErrors && fieldName === 'confirmarContrasenia') {
        if (formErrors['passwordRequired']) {
          return 'Este campo es requerido';
        }
        if (formErrors['mismatch']) {
          return 'Las contraseñas no coinciden';
        }
      }
    }

    return '';
  }
}

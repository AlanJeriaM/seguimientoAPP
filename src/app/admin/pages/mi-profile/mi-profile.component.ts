import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { AdminService } from '../../../core/services/admin/admin.service';

@Component({
  selector: 'app-mi-profile',
  templateUrl: './mi-profile.component.html',
  styleUrl: './mi-profile.component.css'
})
export class MiProfileComponent implements OnInit {
  perfilForm: FormGroup;
  loading = false;
  error: string | null = null;
  perfil: any = null;
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private messageService: MessageService
  ) {
    this.perfilForm = this.fb.group({
      nombre_usuario: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      email_usuario: ['', [Validators.required, Validators.email]],
      contrasenia: ['', [Validators.minLength(6)]],
      confirmarContrasenia: ['']
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.cargarPerfil();
  }

  // Validador para confirmar contraseña
  passwordMatchValidator(group: FormGroup) {
    const contrasenia = group.get('contrasenia')?.value;
    const confirmarContrasenia = group.get('confirmarContrasenia')?.value;
    
    if (contrasenia && confirmarContrasenia) {
      return contrasenia === confirmarContrasenia ? null : { passwordMismatch: true };
    }
    return null;
  }

  // Cargar perfil del administrador
  async cargarPerfil() {
    this.loading = true;
    this.error = null;

    try {
      const response = await this.adminService.obtenerMiPerfil().toPromise();
      
      if (response.ok) {
        this.perfil = response.data;
        this.cargarDatosEnFormulario();
      } else {
        this.error = response.msj || 'Error al cargar el perfil';
      }
    } catch (error) {
      this.error = 'Error de conexión. Intenta nuevamente.';
    } finally {
      this.loading = false;
    }
  }

  // Cargar datos en el formulario
  cargarDatosEnFormulario() {
    if (this.perfil) {
      this.perfilForm.patchValue({
        nombre_usuario: this.perfil.nombre_usuario || '',
        apellido: this.perfil.apellido || '',
        email_usuario: this.perfil.email_usuario || '',
        contrasenia: '',
        confirmarContrasenia: ''
      });
    }
  }

  // Enviar formulario
  async onSubmit() {
    if (this.perfilForm.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor, completa todos los campos requeridos correctamente'
      });
      return;
    }

    this.loading = true;
    const formData = this.perfilForm.value;

    try {
      const response = await this.adminService.actualizarMiPerfil(formData).toPromise();
      
      if (response.ok) {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Perfil actualizado correctamente'
        });
        
        // Recargar perfil para obtener datos actualizados
        await this.cargarPerfil();
        
        // Limpiar campos de contraseña
        this.perfilForm.patchValue({
          contrasenia: '',
          confirmarContrasenia: ''
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: response.msj || 'Error al actualizar el perfil'
        });
      }
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error de conexión. Intenta nuevamente.'
      });
    } finally {
      this.loading = false;
    }
  }

  // Validaciones de campos
  isFieldInvalid(fieldName: string): boolean {
    const field = this.perfilForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  getFieldError(fieldName: string): string {
    const field = this.perfilForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'Este campo es requerido';
    if (field.errors['email']) return 'Ingresa un email válido';
    if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    if (field.errors['passwordMismatch']) return 'Las contraseñas no coinciden';

    return 'Campo inválido';
  }

  // Toggle para mostrar/ocultar contraseñas
  togglePasswordVisibility(field: 'contrasenia' | 'confirmarContrasenia') {
    if (field === 'contrasenia') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  // Obtener tipo de input para contraseña
  getPasswordInputType(field: 'contrasenia' | 'confirmarContrasenia'): string {
    if (field === 'contrasenia') {
      return this.showPassword ? 'text' : 'password';
    } else {
      return this.showConfirmPassword ? 'text' : 'password';
    }
  }

  // Obtener iniciales del usuario
  getUserInitials(): string {
    if (this.perfil) {
      const nombre = this.perfil.nombre_usuario || '';
      const apellido = this.perfil.apellido || '';
      return (nombre.charAt(0) + apellido.charAt(0)).toUpperCase();
    }
    return 'A';
  }

  // Obtener fecha de creación del perfil
  getProfileCreationDate(): string {
    if (this.perfil?.createdAt) {
      return new Date(this.perfil.createdAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return 'Fecha no disponible';
  }

  // Obtener fecha y hora del último acceso
  getFormattedDateTime(dateTime: string): string {
    if (dateTime) {
      return new Date(dateTime).toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return 'No disponible';
  }
}

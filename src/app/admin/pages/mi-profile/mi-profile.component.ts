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

  // Variables para detección de cambios y modal de confirmación
  private formInitialValue: any = null;
  hasFormChanges = false;
  private initialFormStateSaved = false;
  displayUpdateDialog: boolean = false;
  updating: boolean = false;

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

    // Suscribirse a cambios en el formulario para detección de cambios
    this.perfilForm.valueChanges.subscribe(() => {
      this.detectFormChanges();
    });
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

      // Guardar estado inicial después de cargar los datos
      setTimeout(() => {
        this.saveInitialFormState();
      }, 100);
    }
  }

  // Guardar estado inicial del formulario
  private saveInitialFormState() {
    if (this.perfilForm) {
      this.formInitialValue = { ...this.perfilForm.value };
      this.hasFormChanges = false;
      this.initialFormStateSaved = true;
    }
  }

  // Detectar cambios en el formulario
  private detectFormChanges() {
    if (!this.formInitialValue || !this.perfilForm || !this.initialFormStateSaved) {
      this.hasFormChanges = false;
      return;
    }

    const currentValue = { ...this.perfilForm.value };
    const hasChanges = this.hasRealChanges(this.formInitialValue, currentValue);
    const passwordFieldsValid = this.arePasswordFieldsValid();
    
    // Solo considerar que hay cambios si hay cambios reales Y los campos de contraseña son válidos
    this.hasFormChanges = hasChanges && passwordFieldsValid;
  }

  // Verificar si hay cambios reales
  private hasRealChanges(initial: any, current: any): boolean {
    const fieldsToCompare = ['nombre_usuario', 'apellido', 'email_usuario', 'contrasenia'];
    
    for (const field of fieldsToCompare) {
      const initialValue = initial[field];
      const currentValue = current[field];
      
      if (field === 'contrasenia') {
        // Para contraseña, solo considerar cambio si hay valor nuevo
        if (currentValue && currentValue.trim() !== '') {
          return true;
        }
      } else if (initialValue !== currentValue) {
        return true;
      }
    }
    
    return false;
  }

  // Verificar si los campos de contraseña son válidos
  private arePasswordFieldsValid(): boolean {
    const contrasenia = this.perfilForm.get('contrasenia')?.value;
    const confirmarContrasenia = this.perfilForm.get('confirmarContrasenia')?.value;
    
    // Si no hay contraseña, es válido
    if (!contrasenia || contrasenia.trim() === '') {
      return true;
    }
    
    // Si hay contraseña, debe haber confirmación y deben coincidir
    return confirmarContrasenia && 
           confirmarContrasenia.trim() !== '' && 
           contrasenia === confirmarContrasenia;
  }

  // Descartar cambios
  descartarCambios() {
    if (this.perfil) {
      // Restaurar valores originales
      this.perfilForm.patchValue({
        nombre_usuario: this.perfil.nombre_usuario || '',
        apellido: this.perfil.apellido || '',
        email_usuario: this.perfil.email_usuario || '',
        contrasenia: '',
        confirmarContrasenia: ''
      });
      
      // Marcar el formulario como no tocado
      this.perfilForm.markAsUntouched();
      this.perfilForm.markAsPristine();
      
      // Guardar el nuevo estado inicial
      this.saveInitialFormState();
      
      this.messageService.add({
        severity: 'info',
        summary: 'Cambios descartados',
        detail: 'Se han restaurado los valores originales',
        life: 3000
      });
    }
  }

  // Abrir modal de confirmación
  onUpdateClick() {
    // Validar formulario
    this.perfilForm.markAllAsTouched();
    
    if (this.perfilForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario inválido',
        detail: 'Por favor, completa todos los campos requeridos correctamente',
        life: 4000
      });
      return;
    }

    if (!this.hasFormChanges) {
      this.messageService.add({
        severity: 'info',
        summary: 'Sin cambios',
        detail: 'No hay cambios para actualizar',
        life: 3000
      });
      return;
    }

    this.displayUpdateDialog = true;
  }

  // Confirmar actualización
  async confirmarActualizacion() {
    // Validar formulario
    this.perfilForm.markAllAsTouched();
    
    if (this.perfilForm.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor, completa todos los campos requeridos correctamente',
        life: 4000
      });
      return;
    }

    this.updating = true;
    const formData = this.perfilForm.value;

    try {
      const response = await this.adminService.actualizarMiPerfil(formData).toPromise();
      
      if (response.ok) {
        this.displayUpdateDialog = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Perfil actualizado correctamente',
          life: 3000
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
          detail: response.msj || 'Error al actualizar el perfil',
          life: 5000
        });
      }
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error de conexión. Intenta nuevamente.',
        life: 5000
      });
    } finally {
      this.updating = false;
    }
  }

  // Cancelar actualización
  cancelarActualizacion() {
    this.displayUpdateDialog = false;
    this.updating = false;
  }

  // Método legacy para compatibilidad (ahora redirige al modal)
  async onSubmit() {
    this.onUpdateClick();
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

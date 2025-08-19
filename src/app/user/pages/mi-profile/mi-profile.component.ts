import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth/auth.service';
import { MessageService } from 'primeng/api';

export interface PerfilUsuario {
  id: number;
  nombre: string;
  correo: string;
  perfil_imagen_url: string | null;
  posicion_actual: string;
  empresa_actual: string;
  ubicacion: string;
  resumen: string;
  industria: string;
  ultimo_acceso: Date | null;
  fecha_registro: Date;
  rol: string;
}

@Component({
  selector: 'app-mi-profile',
  templateUrl: './mi-profile.component.html',
  styleUrl: './mi-profile.component.css',
  providers: [MessageService]
})
export class MiProfileComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  perfilForm!: FormGroup;
  perfil: PerfilUsuario | null = null;
  loading = true;
  saving = false;
  error: string | null = null;
  imageError = false;

  // Opciones para dropdowns
  industriasOpciones = [
    'Tecnología de la información y servicios',
    'Servicios financieros',
    'Consultoría de gestión',
    'Educación',
    'Salud y bienestar',
    'Retail',
    'Manufactura',
    'Telecomunicaciones',
    'Medios y comunicación',
    'Energía y servicios públicos',
    'Construcción',
    'Turismo y hostelería',
    'Transporte y logística',
    'Otros'
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private messageService: MessageService
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    // Agregar un pequeño delay para asegurar que todo esté inicializado
    setTimeout(() => {
      this.cargarPerfil();
    }, 100);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm() {
    this.perfilForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      posicion_actual: ['', [Validators.maxLength(150)]],
      empresa_actual: ['', [Validators.maxLength(150)]],
      ubicacion: ['', [Validators.maxLength(100)]],
      industria: ['', [Validators.maxLength(100)]],
      resumen: ['', [Validators.maxLength(500)]]
    });
  }

  cargarPerfil() {
    console.log('🔄 Iniciando carga de perfil...');
    this.loading = true;
    this.error = null;

    this.authService.obtenerMiPerfil()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('📡 Respuesta del servidor:', response);
          if (response.ok) {
            this.perfil = response.usuario;
            console.log('✅ Perfil cargado:', this.perfil);
            this.populateForm();
          } else {
            this.error = response.msj || 'Error al cargar el perfil';
            console.log('❌ Error en respuesta:', this.error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: this.error || 'Error desconocido'
            });
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Error HTTP cargando perfil:', error);
          this.error = 'Error al cargar el perfil';
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cargar el perfil'
          });
        }
      });
  }

  private populateForm() {
    if (this.perfil) {
      console.log('📅 Fecha de registro (created_at):', this.perfil.fecha_registro);
      console.log('📅 Fecha formateada:', this.getFormattedDate(this.perfil.fecha_registro));
      console.log('🕐 Último acceso:', this.perfil.ultimo_acceso);
      
      this.perfilForm.patchValue({
        nombre: this.perfil.nombre || '',
        posicion_actual: this.perfil.posicion_actual === 'No especificada' ? '' : this.perfil.posicion_actual,
        empresa_actual: this.perfil.empresa_actual === 'No especificada' ? '' : this.perfil.empresa_actual,
        ubicacion: this.perfil.ubicacion === 'No especificada' ? '' : this.perfil.ubicacion,
        industria: this.perfil.industria === 'No especificada' ? '' : this.perfil.industria,
        resumen: this.perfil.resumen === 'Sin resumen' ? '' : this.perfil.resumen
      });
    }
  }

  onSubmit() {
    if (this.perfilForm.valid) {
      this.guardarPerfil();
    } else {
      this.markFormGroupTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario inválido',
        detail: 'Por favor revise los campos marcados'
      });
    }
  }

  private guardarPerfil() {
    this.saving = true;
    const datosActualizados = this.perfilForm.value;

    this.authService.actualizarMiPerfil(datosActualizados)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.ok) {
            this.perfil = response.usuario;
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Perfil actualizado correctamente'
            });
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: response.msj || 'Error al actualizar el perfil'
            });
          }
          this.saving = false;
        },
        error: (error) => {
          console.error('Error actualizando perfil:', error);
          this.saving = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al actualizar el perfil'
          });
        }
      });
  }

  private markFormGroupTouched() {
    Object.keys(this.perfilForm.controls).forEach(key => {
      const control = this.perfilForm.get(key);
      control?.markAsTouched();
    });
  }

  // Helpers para validaciones
  isFieldInvalid(fieldName: string): boolean {
    const field = this.perfilForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.perfilForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} es requerido`;
      if (field.errors['minlength']) return `${this.getFieldLabel(fieldName)} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors['maxlength']) return `${this.getFieldLabel(fieldName)} no puede exceder ${field.errors['maxlength'].requiredLength} caracteres`;
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'nombre': 'El nombre',
      'posicion_actual': 'La posición actual',
      'empresa_actual': 'La empresa actual',
      'ubicacion': 'La ubicación',
      'industria': 'La industria',
      'resumen': 'El resumen'
    };
    return labels[fieldName] || fieldName;
  }

  resetForm() {
    this.populateForm();
    this.messageService.add({
      severity: 'info',
      summary: 'Formulario restablecido',
      detail: 'Los cambios han sido descartados'
    });
  }

  getUserInitials(): string {
    if (!this.perfil?.nombre) return 'US';
    const names = this.perfil.nombre.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }

  getFormattedDate(date: Date | null): string {
    if (!date) return 'No disponible';
    
    const fechaObj = new Date(date);
    
    // Verificar si la fecha es válida
    if (isNaN(fechaObj.getTime())) {
      return 'Fecha inválida';
    }
    
    return fechaObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Santiago' // Para Chile
    });
  }

  getFormattedDateTime(date: Date | null): string {
    if (!date) return 'No disponible';
    
    const fechaObj = new Date(date);
    
    if (isNaN(fechaObj.getTime())) {
      return 'Fecha inválida';
    }
    
    return fechaObj.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Santiago'
    });
  }

  getProfileCreationDate(): string {
    if (!this.perfil?.fecha_registro) {
      console.log('⚠️ No hay fecha_registro en el perfil');
      return 'No disponible';
    }
    
    console.log('📅 Fecha de registro raw:', this.perfil.fecha_registro);
    const fechaCreacion = new Date(this.perfil.fecha_registro);
    console.log('📅 Fecha de registro parseada:', fechaCreacion);
    
    if (isNaN(fechaCreacion.getTime())) {
      console.log('❌ Fecha de registro inválida');
      return 'Fecha inválida';
    }
    
    const fechaFormateada = fechaCreacion.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Santiago'
    });
    
    console.log('✅ Fecha de registro formateada:', fechaFormateada);
    return fechaFormateada;
  }

  handleImageError(event: any) {
    console.log('Error cargando imagen de perfil:', event.target.src);
    this.imageError = true;
  }
}

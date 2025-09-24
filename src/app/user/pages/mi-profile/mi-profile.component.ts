import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth/auth.service';
import { MessageService } from 'primeng/api';
import { ActivatedRoute, Router } from '@angular/router';
import { ProfileCompletionGuard } from '../../../core/guards/profile-completion.guard';

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
  // Nuevos campos para métricas
  perfil_completo?: boolean;
  años_experiencia?: number;
  nivel_educacion?: string;
  especialidad_tecnica?: string;
  tipo_empleo_actual?: string;
  rango_salarial?: string;
  disponibilidad_cambio?: string;
  tecnologias_principales?: string[];
  area_interes?: string;
  satisfaccion_laboral?: number;
  opciones_personalizadas_educacion?: string[];
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
  isCompletionMode = false; // Indica si estamos en modo de completar perfil obligatorio

  // Propiedades para campos "otro"
  showNivelEducacionOtro = false;
  showEspecialidadOtro = false;
  showTipoEmpleoOtro = false;
  showAreaInteresOtro = false;
  
  // Variables para agregar opciones personalizadas
  showAddNivelEducacionDialog = false;
  nuevaNivelEducacion: string = '';
  opcionesPersonalizadasEducacion: string[] = []; // Opciones personalizadas del usuario

  // Progreso del perfil
  profileProgress = 0;

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

  // Nuevas opciones para campos de métricas
  nivelesEducacion = [
    'Diplomado',
    'Postítulo',
    'Magíster Profesional',
    'Magíster Académico',
    'Doctorado',
    'Sin especialización'
  ];

  tiposEmpleo = [
    'Tiempo completo',
    'Part-time',
    'Freelance',
    'Desempleado',
    'Estudiante',
    'Otro'
  ];

  rangosSalariales = [
    '0-500k',
    '500k-1M',
    '1M-1.5M',
    '1.5M-2M',
    '2M-3M',
    '3M+',
    'Prefiero no decir'
  ];

  disponibilidadOpciones = [
    'Activamente buscando',
    'Abierto a oportunidades',
    'No disponible',
    'No seguro',
    'Sin trabajo'
  ];

  areasInteres = [
    'Frontend Development',
    'Backend Development',
    'Full Stack Development',
    'DevOps',
    'Data Science',
    'Machine Learning',
    'Mobile Development',
    'QA/Testing',
    'UI/UX Design',
    'Product Management',
    'Project Management',
    'Cybersecurity',
    'Cloud Computing',
    'Otro'
  ];

  especialidadesTecnicas = [
    'JavaScript',
    'Python',
    'Java',
    'C#',
    'PHP',
    'TypeScript',
    'React',
    'Angular',
    'Vue.js',
    'Node.js',
    '.NET',
    'Spring',
    'Laravel',
    'Django',
    'Ruby on Rails',
    'Go',
    'Rust',
    'Kotlin',
    'Swift',
    'Flutter',
    'React Native',
    'Otro'
  ];

  tecnologiasPrincipales = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'PHP', 'Go', 'Rust',
    'React', 'Angular', 'Vue.js', 'Node.js', 'Express', 'Django', 'Flask',
    'Spring Boot', 'Laravel', '.NET', 'PostgreSQL', 'MySQL', 'MongoDB',
    'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'Google Cloud',
    'Git', 'Jenkins', 'GitLab CI', 'Figma', 'Adobe XD', 'Sketch'
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private router: Router,
    private profileGuard: ProfileCompletionGuard,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    // Verificar si estamos en modo de completar perfil
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.isCompletionMode = params['completar'] === 'true';
      if (params['mensaje']) {
        this.messageService.add({
          severity: 'info',
          summary: 'Completar Perfil',
          detail: params['mensaje'],
          life: 5000
        });
      }
    });

    // Agregar un pequeño delay para asegurar que todo esté inicializado
    setTimeout(() => {
      this.cargarPerfil();
    }, 100);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Métodos para manejar campos "otro"
  onNivelEducacionChange(selectedValues: string[]) {
    // Si se selecciona "Sin especialización", deseleccionar todas las demás opciones
    if (selectedValues.includes('Sin especialización')) {
      this.perfilForm.get('nivel_educacion')?.setValue(['Sin especialización']);
    }
    
    // Limpiar el campo "otro" ya que no existe más
    const otroControl = this.perfilForm.get('nivel_educacion_otro');
    if (otroControl) {
      otroControl.clearValidators();
      otroControl.setValue('');
      otroControl.updateValueAndValidity();
    }
  }

  onEspecialidadChange(value: string[]) {
    this.showEspecialidadOtro = value && value.includes('Otro');
    const otroControl = this.perfilForm.get('especialidad_tecnica_otro');
    
    if (this.showEspecialidadOtro) {
      // Hacer obligatorio cuando se muestra
      otroControl?.setValidators([Validators.required]);
    } else {
      // Quitar validadores y limpiar valor cuando se oculta
      otroControl?.clearValidators();
      otroControl?.setValue('');
    }
    otroControl?.updateValueAndValidity();
  }

  onTipoEmpleoChange(value: string) {
    this.showTipoEmpleoOtro = value === 'Otro';
    const otroControl = this.perfilForm.get('tipo_empleo_otro');
    
    if (this.showTipoEmpleoOtro) {
      // Hacer obligatorio cuando se muestra
      otroControl?.setValidators([Validators.required]);
    } else {
      // Quitar validadores y limpiar valor cuando se oculta
      otroControl?.clearValidators();
      otroControl?.setValue('');
    }
    otroControl?.updateValueAndValidity();
  }

  onAreaInteresChange(value: string) {
    this.showAreaInteresOtro = value === 'Otro';
    const otroControl = this.perfilForm.get('area_interes_otro');
    
    if (this.showAreaInteresOtro) {
      // Hacer obligatorio cuando se muestra
      otroControl?.setValidators([Validators.required]);
    } else {
      // Quitar validadores y limpiar valor cuando se oculta
      otroControl?.clearValidators();
      otroControl?.setValue('');
    }
    otroControl?.updateValueAndValidity();
  }

  // Métodos para agregar opciones personalizadas
  agregarNivelEducacion() {
    if (this.nuevaNivelEducacion?.trim()) {
      const nuevaOpcion = this.nuevaNivelEducacion.trim();
      
      // Verificar que no exista ya en las opciones base ni personalizadas
      if (!this.nivelesEducacion.includes(nuevaOpcion) && !this.opcionesPersonalizadasEducacion.includes(nuevaOpcion)) {
        // Agregar a opciones personalizadas
        this.opcionesPersonalizadasEducacion.push(nuevaOpcion);
        
        // Agregar a la lista completa para el dropdown
        this.nivelesEducacion.push(nuevaOpcion);
        
        // Agregar la nueva opción a la selección actual
        const valoresActuales = this.perfilForm.get('nivel_educacion')?.value || [];
        this.perfilForm.get('nivel_educacion')?.setValue([...valoresActuales, nuevaOpcion]);
        
        // Limpiar y cerrar el diálogo
        this.cancelarAgregarNivelEducacion();
        
        // Guardar las opciones personalizadas en el perfil
        this.guardarOpcionesPersonalizadas();
      } else {
        // Mostrar mensaje de que ya existe
        this.messageService.add({
          severity: 'warn',
          summary: 'Opción existente',
          detail: 'Esta opción ya existe en la lista'
        });
      }
    }
  }

  cancelarAgregarNivelEducacion() {
    this.nuevaNivelEducacion = '';
    this.showAddNivelEducacionDialog = false;
  }

  onNuevaNivelEducacionChange(event: any) {
    this.nuevaNivelEducacion = event.target.value;
    this.cdr.detectChanges(); // Forzar detección de cambios
  }

  get isNuevaNivelEducacionValid(): boolean {
    return this.nuevaNivelEducacion.trim() !== '';
  }

  // Guardar opciones personalizadas en el perfil
  private guardarOpcionesPersonalizadas() {
    if (this.perfil) {
      // Agregar las opciones personalizadas al perfil para persistencia
      this.perfil.opciones_personalizadas_educacion = this.opcionesPersonalizadasEducacion;
    }
  }

  // Calcular progreso del perfil
  calculateProfileProgress(): number {
    if (!this.perfilForm) return 0;

    const requiredFields = [
      'nombre',
      'años_experiencia',
      'nivel_educacion',
      'especialidad_tecnica',
      'tipo_empleo_actual',
      'disponibilidad_cambio',
      'area_interes',
      'rango_salarial',
      'satisfaccion_laboral'
    ];

    const optionalFields = [
      'posicion_actual',
      'empresa_actual',
      'ubicacion',
      'industria'
    ];


    let completedRequired = 0;
    let completedOptional = 0;

    // Evaluar campos obligatorios (80% del progreso)
    requiredFields.forEach(field => {
      const value = this.perfilForm.get(field)?.value;
      let isCompleted = false;
      
      if (field === 'nivel_educacion' || field === 'especialidad_tecnica') {
        // Para campos de array, verificar que tenga al menos un elemento
        if (Array.isArray(value) && value.length > 0) {
          isCompleted = true;
          completedRequired++;
        }
      } else {
        // Para otros campos, verificar que no estén vacíos y que no sean 0 para satisfaccion_laboral
        if (value !== null && value !== undefined && value !== '') {
          if (field === 'satisfaccion_laboral') {
            // Para satisfacción laboral, aceptar cualquier número >= 1
            if (typeof value === 'number' && value >= 1) {
              isCompleted = true;
              completedRequired++;
            }
          } else {
            isCompleted = true;
            completedRequired++;
          }
        }
      }
      
    });

    // Evaluar campos opcionales (20% del progreso)
    optionalFields.forEach(field => {
      const value = this.perfilForm.get(field)?.value;
      let isCompleted = false;
      
      if (value && value !== '') {
        isCompleted = true;
        completedOptional++;
      }
      
    });

    // Calcular progreso: 80% campos obligatorios + 20% campos opcionales
    const requiredProgress = (completedRequired / requiredFields.length) * 80;
    const optionalProgress = (completedOptional / optionalFields.length) * 20;
    const finalProgress = Math.round(requiredProgress + optionalProgress);
    
    
    return finalProgress;
  }

  // Actualizar progreso cuando cambie el formulario
  updateProgress() {
    this.profileProgress = this.calculateProfileProgress();
  }

  // Métodos para el estado dinámico del perfil
  getProfileStatusLabel(): string {
    if (this.profileProgress === 100) {
      return 'Perfil Completo';
    } else if (this.profileProgress >= 80) {
      return 'Casi Completo';
    } else {
      return 'Perfil Incompleto';
    }
  }

  getProfileStatusSeverity(): 'success' | 'warning' | 'danger' | 'info' {
    if (this.profileProgress === 100) {
      return 'success';
    } else if (this.profileProgress >= 80) {
      return 'warning';
    } else {
      return 'danger';
    }
  }

  getProfileStatusIcon(): string {
    if (this.profileProgress === 100) {
      return 'pi pi-check-circle';
    } else if (this.profileProgress >= 80) {
      return 'pi pi-clock';
    } else {
      return 'pi pi-exclamation-triangle';
    }
  }

  private initializeForm() {
    this.perfilForm = this.fb.group({
      // Campos básicos
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      posicion_actual: ['', [Validators.maxLength(150)]],
      empresa_actual: ['', [Validators.maxLength(150)]],
      ubicacion: ['', [Validators.maxLength(100)]],
      industria: ['', [Validators.maxLength(100)]],
      resumen: ['', [Validators.maxLength(500)]],
      // Nuevos campos obligatorios para métricas
      años_experiencia: ['', [Validators.required, Validators.min(0), Validators.max(50)]],
      nivel_educacion: [[], [Validators.required]],
      nivel_educacion_otro: [''],
      especialidad_tecnica: [[], [Validators.required]],
      especialidad_tecnica_otro: [''],
      tipo_empleo_actual: ['', [Validators.required]],
      tipo_empleo_otro: [''],
      disponibilidad_cambio: ['', [Validators.required]],
      area_interes: ['', [Validators.required]],
      area_interes_otro: [''],
      // Campos complementarios obligatorios
      rango_salarial: ['', [Validators.required]],
      tecnologias_principales: [[]],
      satisfaccion_laboral: ['', [Validators.required]]
    });

    // Suscribirse a cambios del formulario para actualizar progreso
    this.perfilForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.updateProgress();
    });
  }

  cargarPerfil() {
    console.log('Iniciando carga de perfil...');
    this.loading = true;
    this.error = null;

    this.authService.obtenerMiPerfil()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('📡 Respuesta del servidor:', response);
          if (response.ok) {
            this.perfil = response.usuario;
            console.log('Perfil cargado:', this.perfil);
            this.populateForm();
            this.updateProgress();
          } else {
            this.error = response.msj || 'Error al cargar el perfil';
            console.log('Error en respuesta:', this.error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: this.error || 'Error desconocido'
            });
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error HTTP cargando perfil:', error);
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
      console.log('Fecha de registro (created_at):', this.perfil.fecha_registro);
      console.log('Fecha formateada:', this.getFormattedDate(this.perfil.fecha_registro));
      console.log('Último acceso:', this.perfil.ultimo_acceso);

      // Cargar opciones personalizadas si existen
      if (this.perfil.opciones_personalizadas_educacion) {
        this.opcionesPersonalizadasEducacion = this.perfil.opciones_personalizadas_educacion;
        // Agregar opciones personalizadas a la lista de niveles
        this.opcionesPersonalizadasEducacion.forEach(opcion => {
          if (!this.nivelesEducacion.includes(opcion)) {
            this.nivelesEducacion.push(opcion);
          }
        });
      }

      this.perfilForm.patchValue({
        // Campos básicos
        nombre: this.perfil.nombre || '',
        posicion_actual: this.perfil.posicion_actual === 'No especificada' ? '' : this.perfil.posicion_actual,
        empresa_actual: this.perfil.empresa_actual === 'No especificada' ? '' : this.perfil.empresa_actual,
        ubicacion: this.perfil.ubicacion === 'No especificada' ? '' : this.perfil.ubicacion,
        industria: this.perfil.industria === 'No especificada' ? '' : this.perfil.industria,
        resumen: this.perfil.resumen === 'Sin resumen' ? '' : this.perfil.resumen,
        // Nuevos campos para métricas
        años_experiencia: this.perfil.años_experiencia || '',
        nivel_educacion: this.perfil.nivel_educacion || '',
        especialidad_tecnica: this.perfil.especialidad_tecnica || [],
        tipo_empleo_actual: this.perfil.tipo_empleo_actual || '',
        disponibilidad_cambio: this.perfil.disponibilidad_cambio || '',
        area_interes: this.perfil.area_interes || '',
        rango_salarial: this.perfil.rango_salarial || '',
        tecnologias_principales: this.perfil.tecnologias_principales || [],
        satisfaccion_laboral: this.perfil.satisfaccion_laboral || ''
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
    
    // Agregar las opciones personalizadas de educación
    datosActualizados.opciones_personalizadas_educacion = this.opcionesPersonalizadasEducacion;

    console.log('Datos que se van a guardar:', datosActualizados);
    console.log('Opciones personalizadas de educación:', this.opcionesPersonalizadasEducacion);
    console.log('Campos básicos a guardar:', {
      posicion_actual: datosActualizados.posicion_actual,
      empresa_actual: datosActualizados.empresa_actual,
      ubicacion: datosActualizados.ubicacion,
      industria: datosActualizados.industria
    });

    this.authService.actualizarMiPerfil(datosActualizados)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Respuesta del servidor después de guardar:', response);
          if (response.ok) {
            this.perfil = response.usuario;
            if (this.perfil) {
              console.log('Perfil actualizado recibido:', {
                posicion_actual: this.perfil.posicion_actual,
                empresa_actual: this.perfil.empresa_actual,
                ubicacion: this.perfil.ubicacion,
                industria: this.perfil.industria
              });
            }
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Perfil actualizado correctamente'
            });

            // Si estábamos en modo de completar perfil, verificar si ahora está completo
            if (this.isCompletionMode) {
              this.verificarPerfilYRedirigir();
            }
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

  private verificarPerfilYRedirigir() {
    this.authService.verificarPerfilCompleto()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.ok && response.perfil_completo) {
            // Perfil completo, redirigir al dashboard
            this.messageService.add({
              severity: 'success',
              summary: '¡Perfil Completo!',
              detail: 'Ahora puedes acceder a todas las funcionalidades',
              life: 3000
            });

            // Limpiar cache del guard antes de redirigir
            this.profileGuard.clearCache();

            setTimeout(() => {
              this.router.navigate(['/user/dashboard']);
            }, 1500);
          } else {
            // Aún faltan campos, mostrar cuáles
            const camposFaltantes = response.campos_faltantes || [];
            this.messageService.add({
              severity: 'warn',
              summary: 'Perfil Incompleto',
              detail: `Aún faltan campos: ${camposFaltantes.join(', ')}`,
              life: 5000
            });
          }
        },
        error: (error) => {
          console.error('Error verificando perfil completo:', error);
        }
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
      if (field.errors['required']) return 'el campo es requerido';
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
      console.log('No hay fecha_registro en el perfil');
      return 'No disponible';
    }

    console.log('Fecha de registro:', this.perfil.fecha_registro);
    const fechaCreacion = new Date(this.perfil.fecha_registro);
    console.log('Fecha de registro parseada:', fechaCreacion);

    if (isNaN(fechaCreacion.getTime())) {
      console.log('Fecha de registro inválida');
      return 'Fecha inválida';
    }

    const fechaFormateada = fechaCreacion.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Santiago'
    });

    console.log('Fecha de registro formateada:', fechaFormateada);
    return fechaFormateada;
  }

  handleImageError(event: any) {
    console.log('Error cargando imagen de perfil:', event.target.src);
    this.imageError = true;
  }
}

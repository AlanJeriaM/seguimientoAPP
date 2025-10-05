import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth/auth.service';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';

interface PerfilUsuario {
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
  nivel_educacion?: string[];
  especialidad_tecnica?: string[];
  tipo_empleo_actual?: string;
  rango_salarial?: string;
  disponibilidad_cambio?: string;
  tecnologias_principales?: string[];
  area_interes?: string;
  satisfaccion_laboral?: number;
  opciones_personalizadas_educacion?: string[];
  opciones_personalizadas_tecnologias?: string[];
  opciones_personalizadas_area_interes?: string[];
  opciones_personalizadas_industria?: string[];
}

@Component({
  selector: 'app-edit-user-profile',
  templateUrl: './edit-user-profile.component.html',
  styleUrls: ['./edit-user-profile.component.css']
})
export class EditUserProfileComponent implements OnInit, OnDestroy {
  @Input() usuario: any = null;
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() usuarioActualizado = new EventEmitter<any>();

  perfilForm!: FormGroup;
  perfil: PerfilUsuario | null = null;
  loading = false;
  saving = false;
  error: string | null = null;
  imageError = false;

  // Propiedades para campos "otro"
  showNivelEducacionOtro = false;
  showEspecialidadOtro = false;
  showAreaInteresOtro = false;

  // Variables para agregar opciones personalizadas
  showAddNivelEducacionDialog = false;
  nuevaNivelEducacion: string = '';
  opcionesPersonalizadasEducacion: string[] = [];

  // Variables para agregar opciones personalizadas de tecnologías
  showAddTecnologiaDialog = false;
  nuevaTecnologia: string = '';
  opcionesPersonalizadasTecnologias: string[] = [];

  // Variables para área de interés personalizada
  showAddAreaInteresDialog = false;
  nuevaAreaInteres: string = '';
  opcionesPersonalizadasAreaInteres: string[] = [];

  // Variables para agregar opciones personalizadas de industria
  showAddIndustriaDialog = false;
  nuevaIndustria: string = '';
  opcionesPersonalizadasIndustria: string[] = [];

  // Variables para control de cambios en el formulario
  private formInitialValue: any = null;
  hasFormChanges = false;
  private initialFormStateSaved = false;

  private destroy$ = new Subject<void>();

  // Opciones para dropdowns
  industriasBase = [
    'tecnología de la información y servicios',
    'servicios financieros',
    'consultoría de gestión',
    'educación',
    'salud y bienestar',
    'retail',
    'manufactura',
    'telecomunicaciones',
    'medios y comunicación',
    'energía y servicios públicos',
    'construcción',
    'turismo y hostelería',
    'transporte y logística'
  ];

  // Opciones completas para el dropdown (base + personalizadas)
  industriasOpciones: string[] = [];

  // Nuevas opciones para campos de métricas
  // Opciones base para dropdowns (sin opciones personalizadas)
  nivelesEducacionBase: string[] = [
    'sin especialización',
    'técnico',
    'profesional',
    'diplomado',
    'postítulo',
    'magíster profesional',
    'magíster académico',
    'doctorado'
  ];

  // Opciones completas para el dropdown (base + personalizadas)
  nivelesEducacion: string[] = [];

  especialidadesTecnicasBase = [
    'javascript',
    'python',
    'java',
    'c#',
    'php',
    'typescript',
    'react',
    'angular',
    'vue.js',
    'node.js',
    '.net',
    'spring',
    'laravel',
    'django',
    'ruby on rails',
    'go',
    'rust',
    'kotlin',
    'swift',
    'flutter',
    'react native'
  ];

  // Opciones completas para el dropdown (base + personalizadas)
  especialidadesTecnicas: string[] = [];

  areasInteresBase = [
    'frontend development',
    'backend development',
    'full stack development',
    'devops',
    'data science',
    'machine learning',
    'mobile development',
    'qa/testing',
    'ui/ux design',
    'product management',
    'project management',
    'cybersecurity',
    'cloud computing'
  ];
  areasInteres: string[] = [];

  tiposEmpleo = [
    'Tiempo completo',
    'Part-time',
    'Freelance',
    'Desempleado',
    'Estudiante'
  ];

  rangosSalariales = [
    '$0 - $500.000',
    '$500.001 - $1.000.000',
    '$1.000.001 - $2.000.000',
    '$2.000.001 - $3.000.000',
    '$3.000.001+',
  ];

  disponibilidadOpciones = [
    'Activamente buscando',
    'Abierto a oportunidades',
    'No disponible',
    'Sin trabajo'
  ];

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {
    console.log('🔧 EditUserProfileComponent constructor llamado');
    console.log('🔧 hasFormChanges inicial:', this.hasFormChanges);
    this.initializeForm();
  }

  ngOnInit() {
    // No reconstruir listas aquí - se hará en populateForm cuando se carguen los datos
    // Las listas se inicializarán cuando se abra el modal con datos del usuario

    // Suscribirse a cambios en el formulario
    this.perfilForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.detectFormChanges();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges() {
    console.log('🔧 ngOnChanges llamado:', {
      usuario: this.usuario,
      visible: this.visible
    });
    if (this.usuario && this.visible) {
      console.log('🔧 Llamando a cargarPerfil');
      this.cargarPerfil();
    }
  }

  initializeForm() {
    this.perfilForm = this.formBuilder.group({
      // Campos básicos
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      posicion_actual: ['', [Validators.required, Validators.maxLength(150)]],
      empresa_actual: ['', [Validators.required, Validators.maxLength(150)]],
      ubicacion: ['', [Validators.required, Validators.maxLength(100)]],
      industria: ['', [Validators.required, Validators.maxLength(100)]],
      // Nuevos campos obligatorios para métricas
      años_experiencia: ['', [Validators.required, Validators.min(0), Validators.max(50)]],
      nivel_educacion: [[], [Validators.required]],
      nivel_educacion_otro: [''],
      especialidad_tecnica: [[], [Validators.required]],
      especialidad_tecnica_otro: [''],
      tipo_empleo_actual: ['', [Validators.required]],
      disponibilidad_cambio: ['', [Validators.required]],
      area_interes: ['', [Validators.required]],
      area_interes_otro: [''],
      // Campos complementarios obligatorios
      rango_salarial: ['', [Validators.required]],
      tecnologias_principales: [[]],
      satisfaccion_laboral: [null, [Validators.min(1), Validators.max(5)]]
    });
  }

  cargarPerfil() {
    console.log('🔧 cargarPerfil llamado');
    if (!this.usuario) {
      console.log('🔧 No hay usuario, retornando');
      return;
    }

    this.loading = true;
    this.error = null;

    // Debug: Log de los datos que llegan del usuario
    console.log('Datos del usuario recibidos:', {
      nivel_educacion: this.usuario.nivel_educacion,
      especialidad_tecnica: this.usuario.especialidad_tecnica,
      tecnologias_principales: this.usuario.tecnologias_principales,
      opciones_personalizadas_educacion: this.usuario.opciones_personalizadas_educacion,
      opciones_personalizadas_tecnologias: this.usuario.opciones_personalizadas_tecnologias
    });

    // Simular carga del perfil completo del usuario
    this.perfil = {
      id: this.usuario.id,
      nombre: this.usuario.nombre || 'Sin nombre',
      correo: this.usuario.correo || 'Sin correo',
      perfil_imagen_url: this.usuario.perfil_imagen_url,
      posicion_actual: this.usuario.posicion_actual || 'No especificada',
      empresa_actual: this.usuario.empresa_actual || 'No especificada',
      ubicacion: this.usuario.ubicacion || 'No especificada',
      resumen: this.usuario.resumen || 'Sin resumen',
      industria: this.usuario.industria || 'No especificada',
      ultimo_acceso: this.usuario.ultimo_acceso,
      fecha_registro: this.usuario.fecha_registro,
      rol: this.usuario.rol,
      perfil_completo: this.usuario.perfil_completo || false,
      años_experiencia: this.usuario.años_experiencia,
      nivel_educacion: this.parseArrayField(this.usuario.nivel_educacion),
      especialidad_tecnica: this.parseArrayField(this.usuario.especialidad_tecnica),
      tipo_empleo_actual: this.usuario.tipo_empleo_actual,
      rango_salarial: this.usuario.rango_salarial,
      disponibilidad_cambio: this.usuario.disponibilidad_cambio,
      tecnologias_principales: this.parseArrayField(this.usuario.tecnologias_principales),
      area_interes: this.usuario.area_interes,
      satisfaccion_laboral: this.usuario.satisfaccion_laboral,
      opciones_personalizadas_educacion: this.parseArrayField(this.usuario.opciones_personalizadas_educacion),
      opciones_personalizadas_tecnologias: this.parseArrayField(this.usuario.opciones_personalizadas_tecnologias),
      opciones_personalizadas_area_interes: this.parseArrayField(this.usuario.opciones_personalizadas_area_interes),
      opciones_personalizadas_industria: this.parseArrayField(this.usuario.opciones_personalizadas_industria)
    };

    this.populateForm();
    this.loading = false;
  }

  private populateForm() {
    if (this.perfil) {
      // Debug: Log de opciones personalizadas
      console.log('🔍 Opciones personalizadas antes de cargar:', {
        educacion: this.perfil.opciones_personalizadas_educacion,
        tecnologias: this.perfil.opciones_personalizadas_tecnologias,
        nivel_educacion: this.perfil.nivel_educacion,
        especialidad_tecnica: this.perfil.especialidad_tecnica
      });

      // Cargar opciones personalizadas si existen
      if (this.perfil.opciones_personalizadas_educacion) {
        this.opcionesPersonalizadasEducacion = this.perfil.opciones_personalizadas_educacion;
      }

      if (this.perfil.opciones_personalizadas_tecnologias) {
        this.opcionesPersonalizadasTecnologias = this.perfil.opciones_personalizadas_tecnologias;
      }

      if (this.perfil.opciones_personalizadas_area_interes) {
        this.opcionesPersonalizadasAreaInteres = this.perfil.opciones_personalizadas_area_interes;
      }

      if (this.perfil.opciones_personalizadas_industria) {
        this.opcionesPersonalizadasIndustria = this.perfil.opciones_personalizadas_industria;
      }

      // Reconstruir las listas completas
      this.reconstruirListaNivelesEducacion();
      this.reconstruirListaTecnologias();
      this.reconstruirListaAreasInteres();
      this.reconstruirListaIndustrias();

      // Debug: Log de listas reconstruidas
      console.log('🔍 Listas reconstruidas:', {
        nivelesEducacion: this.nivelesEducacion,
        especialidadesTecnicas: this.especialidadesTecnicas,
        opcionesPersonalizadasEducacion: this.opcionesPersonalizadasEducacion,
        opcionesPersonalizadasTecnologias: this.opcionesPersonalizadasTecnologias
      });

      // Verificar que las listas tengan el contenido correcto
      console.log('🔍 Verificación de listas:', {
        nivelesEducacionLength: this.nivelesEducacion.length,
        especialidadesTecnicasLength: this.especialidadesTecnicas.length,
        nivelesEducacionBaseLength: this.nivelesEducacionBase.length,
        especialidadesTecnicasBaseLength: this.especialidadesTecnicasBase.length
      });

      // Forzar actualización de la vista después de reconstruir listas
      this.cdr.detectChanges();

      // Establecer valores del formulario uno por uno para evitar problemas con PrimeNG
      this.perfilForm.patchValue({
        // Campos básicos
        nombre: this.perfil.nombre || '',
        posicion_actual: this.perfil.posicion_actual === 'No especificada' ? '' : this.perfil.posicion_actual,
        empresa_actual: this.perfil.empresa_actual === 'No especificada' ? '' : this.perfil.empresa_actual,
        ubicacion: this.perfil.ubicacion === 'No especificada' ? '' : this.perfil.ubicacion,
        industria: this.perfil.industria === 'No especificada' ? '' : this.perfil.industria,
        resumen: this.perfil.resumen === 'Sin resumen' ? '' : this.perfil.resumen,
        // Nuevos campos para métricas
        años_experiencia: this.perfil.años_experiencia != null ? this.perfil.años_experiencia : null,
        tipo_empleo_actual: this.perfil.tipo_empleo_actual || '',
        disponibilidad_cambio: this.perfil.disponibilidad_cambio || '',
        area_interes: this.perfil.area_interes || '',
        rango_salarial: this.perfil.rango_salarial || '',
        satisfaccion_laboral: this.perfil.satisfaccion_laboral || null
      });

      // Establecer los arrays con setTimeout para asegurar que PrimeNG esté listo
      setTimeout(() => {
        if (this.perfil) {
          // NO filtrar valores - mostrar todos los valores que tiene el usuario
          // Esto permite que se muestren valores que no están en las opciones del dropdown
          console.log('🔧 Estableciendo nivel_educacion sin filtrar:', this.perfil.nivel_educacion);
          console.log('🔧 Opciones disponibles nivel educación:', this.nivelesEducacion);
          this.perfilForm.get('nivel_educacion')?.setValue(this.perfil.nivel_educacion || []);
          
          console.log('🔧 Estableciendo especialidad_tecnica sin filtrar:', this.perfil.especialidad_tecnica);
          console.log('🔧 Opciones disponibles especialidad técnica:', this.especialidadesTecnicas);
          this.perfilForm.get('especialidad_tecnica')?.setValue(this.perfil.especialidad_tecnica || []);
          
          console.log('🔧 Estableciendo tecnologias_principales con setTimeout:', this.perfil.tecnologias_principales);
          this.perfilForm.get('tecnologias_principales')?.setValue(this.perfil.tecnologias_principales || []);
        }

        // Forzar actualización después de establecer los arrays
        this.cdr.detectChanges();
        
        // Log final para verificar
        console.log('🔧 Valores finales después de setTimeout:', {
          nivel_educacion: this.perfilForm.get('nivel_educacion')?.value,
          especialidad_tecnica: this.perfilForm.get('especialidad_tecnica')?.value
        });
      }, 100);

      // Debug: Log de valores del formulario después del patchValue
      console.log('🔍 Valores del formulario después del patchValue:', {
        nivel_educacion: this.perfilForm.get('nivel_educacion')?.value,
        especialidad_tecnica: this.perfilForm.get('especialidad_tecnica')?.value
      });

      // Debug: Verificar que los valores del perfil sean correctos
      console.log('🔍 Valores del perfil que se están usando:', {
        nivel_educacion_perfil: this.perfil.nivel_educacion,
        especialidad_tecnica_perfil: this.perfil.especialidad_tecnica,
        nivel_educacion_type: typeof this.perfil.nivel_educacion,
        especialidad_tecnica_type: typeof this.perfil.especialidad_tecnica
      });
    }
    
    // Forzar actualización de la vista
    this.cdr.detectChanges();
    
    // Guardar estado inicial del formulario DESPUÉS de que todos los valores estén establecidos
    setTimeout(() => {
      this.saveInitialFormState();
    }, 200);
  }

  private saveInitialFormState() {
    if (this.perfilForm) {
      this.formInitialValue = {
        ...this.perfilForm.value,
        opciones_personalizadas_educacion: [...this.opcionesPersonalizadasEducacion],
        opciones_personalizadas_tecnologias: [...this.opcionesPersonalizadasTecnologias],
        opciones_personalizadas_area_interes: [...this.opcionesPersonalizadasAreaInteres],
        opciones_personalizadas_industria: [...this.opcionesPersonalizadasIndustria]
      };
      this.hasFormChanges = false;
      this.initialFormStateSaved = true;
      
      // Debug: Log del estado inicial guardado
      console.log('🔧 Estado inicial guardado:', {
        formInitialValue: this.formInitialValue,
        hasFormChanges: this.hasFormChanges,
        initialFormStateSaved: this.initialFormStateSaved
      });
    }
  }

  private detectFormChanges() {
    if (!this.formInitialValue || !this.perfilForm || !this.initialFormStateSaved) {
      this.hasFormChanges = false;
      return;
    }

    const currentValue = {
      ...this.perfilForm.value,
      opciones_personalizadas_educacion: [...this.opcionesPersonalizadasEducacion],
      opciones_personalizadas_tecnologias: [...this.opcionesPersonalizadasTecnologias],
      opciones_personalizadas_area_interes: [...this.opcionesPersonalizadasAreaInteres],
      opciones_personalizadas_industria: [...this.opcionesPersonalizadasIndustria]
    };

    const hasChanges = this.hasRealChanges(this.formInitialValue, currentValue);
    this.hasFormChanges = hasChanges;
    
    // Debug: Log de detección de cambios
    console.log('🔧 Detección de cambios:', {
      hasChanges: hasChanges,
      initialValue: this.formInitialValue,
      currentValue: currentValue
    });
  }

  normalizeText(text: string): string {
    if (!text) return text;
    return text.trim().toLowerCase();
  }

  private parseArrayField(field: any): any[] {
    console.log('Parsing field:', field, 'Type:', typeof field);
    
    // Si el campo es null, undefined o string vacío, retornar array vacío
    if (!field || field === null || field === undefined || field === '') {
      console.log('Field is null/undefined/empty, returning empty array');
      return [];
    }
    
    // Si es un string, intentar parsearlo como JSON
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field);
        console.log('Parsed JSON:', parsed);
        // Verificar que el resultado parseado sea un array
        const result = Array.isArray(parsed) ? parsed : [];
        console.log('Final result:', result);
        return result;
      } catch (error) {
        console.warn('Error parsing JSON field:', field, error);
        return [];
      }
    }
    
    // Si ya es un array, retornarlo
    if (Array.isArray(field)) {
      console.log('Field is already array:', field);
      return field;
    }
    
    // Si no es ninguno de los casos anteriores, retornar array vacío
    console.log('Field type not recognized, returning empty array');
    return [];
  }

  private hasRealChanges(initial: any, current: any): boolean {
    // Comparar campos principales
    const fieldsToCompare = [
      'nombre', 'posicion_actual', 'empresa_actual', 'ubicacion', 'industria',
      'años_experiencia', 'nivel_educacion', 'especialidad_tecnica', 'tipo_empleo_actual',
      'disponibilidad_cambio', 'area_interes', 'rango_salarial', 'satisfaccion_laboral'
    ];

    for (const field of fieldsToCompare) {
      const initialValue = initial[field];
      const currentValue = current[field];

      if (Array.isArray(initialValue) && Array.isArray(currentValue)) {
        if (initialValue.length !== currentValue.length || !initialValue.every((val: any, index: number) => val === currentValue[index])) {
          console.log(`🔧 Campo ${field} cambió (array):`, { initial: initialValue, current: currentValue });
          return true;
        }
      } else if (initialValue !== currentValue) {
        console.log(`🔧 Campo ${field} cambió:`, { initial: initialValue, current: currentValue });
        return true;
      }
    }

    // Comparar opciones personalizadas
    const initialOpcionesEducacion = initial.opciones_personalizadas_educacion || [];
    const currentOpcionesEducacion = current.opciones_personalizadas_educacion || [];
    if (initialOpcionesEducacion.length !== currentOpcionesEducacion.length || !initialOpcionesEducacion.every((val: any, index: number) => val === currentOpcionesEducacion[index])) {
      console.log('🔧 Opciones personalizadas educación cambió:', { initial: initialOpcionesEducacion, current: currentOpcionesEducacion });
      return true;
    }

    const initialOpcionesTecnologias = initial.opciones_personalizadas_tecnologias || [];
    const currentOpcionesTecnologias = current.opciones_personalizadas_tecnologias || [];
    if (initialOpcionesTecnologias.length !== currentOpcionesTecnologias.length || !initialOpcionesTecnologias.every((val: any, index: number) => val === currentOpcionesTecnologias[index])) {
      console.log('🔧 Opciones personalizadas tecnologías cambió:', { initial: initialOpcionesTecnologias, current: currentOpcionesTecnologias });
      return true;
    }

    const initialOpcionesAreaInteres = initial.opciones_personalizadas_area_interes || [];
    const currentOpcionesAreaInteres = current.opciones_personalizadas_area_interes || [];
    if (initialOpcionesAreaInteres.length !== currentOpcionesAreaInteres.length || !initialOpcionesAreaInteres.every((val: any, index: number) => val === currentOpcionesAreaInteres[index])) {
      console.log('🔧 Opciones personalizadas área interés cambió:', { initial: initialOpcionesAreaInteres, current: currentOpcionesAreaInteres });
      return true;
    }

    const initialOpcionesIndustria = initial.opciones_personalizadas_industria || [];
    const currentOpcionesIndustria = current.opciones_personalizadas_industria || [];
    if (initialOpcionesIndustria.length !== currentOpcionesIndustria.length || !initialOpcionesIndustria.every((val: any, index: number) => val === currentOpcionesIndustria[index])) {
      console.log('🔧 Opciones personalizadas industria cambió:', { initial: initialOpcionesIndustria, current: currentOpcionesIndustria });
      return true;
    }

    return false;
  }

  // Métodos para manejar opciones personalizadas (copiados de mi-perfil)
  reconstruirListaNivelesEducacion() {
    console.log('🔧 reconstruirListaNivelesEducacion llamado');
    console.log('🔧 nivelesEducacionBase:', this.nivelesEducacionBase);
    console.log('🔧 opcionesPersonalizadasEducacion:', this.opcionesPersonalizadasEducacion);
    
    // Solo usar opciones base + opciones personalizadas (igual que en mi-perfil)
    this.nivelesEducacion = [...this.nivelesEducacionBase, ...this.opcionesPersonalizadasEducacion];
    
    console.log('🔧 nivelesEducacion final:', this.nivelesEducacion);
  }

  reconstruirListaTecnologias() {
    console.log('🔧 reconstruirListaTecnologias llamado');
    console.log('🔧 especialidadesTecnicasBase:', this.especialidadesTecnicasBase);
    console.log('🔧 opcionesPersonalizadasTecnologias:', this.opcionesPersonalizadasTecnologias);
    
    // Solo usar opciones base + opciones personalizadas (igual que en mi-perfil)
    this.especialidadesTecnicas = [...this.especialidadesTecnicasBase, ...this.opcionesPersonalizadasTecnologias];
    
    console.log('🔧 especialidadesTecnicas final:', this.especialidadesTecnicas);
  }

  reconstruirListaAreasInteres() {
    this.areasInteres = [...this.areasInteresBase, ...this.opcionesPersonalizadasAreaInteres];
  }

  reconstruirListaIndustrias() {
    this.industriasOpciones = [...this.industriasBase, ...this.opcionesPersonalizadasIndustria];
  }

  // Métodos para nivel de educación personalizada
  esOpcionPersonalizada(option: string): boolean {
    return this.opcionesPersonalizadasEducacion.includes(option);
  }

  eliminarOpcionPersonalizada(option: string, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const index = this.opcionesPersonalizadasEducacion.indexOf(option);
    if (index > -1) {
      this.opcionesPersonalizadasEducacion.splice(index, 1);
    }
    
    this.reconstruirListaNivelesEducacion();
    
    const valorActual = this.perfilForm.get('nivel_educacion')?.value || [];
    const nuevoValor = valorActual.filter((v: string) => v !== option);
    this.perfilForm.get('nivel_educacion')?.setValue(nuevoValor);

    // Detectar cambios después de eliminar
    this.detectFormChanges();

    this.messageService.add({
      severity: 'info',
      summary: 'Opción eliminada',
      detail: `"${option}" ha sido eliminada de las opciones personalizadas`,
      life: 3000
    });
  }

  agregarNivelEducacion() {
    const nuevaOpcion = this.nuevaNivelEducacion.trim();
    
    if (!nuevaOpcion) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campo vacío',
        detail: 'Por favor ingrese el nombre de la opción de educación',
        life: 3000
      });
      return;
    }

    const opcionNormalizada = this.normalizeText(nuevaOpcion);

    if (!this.nivelesEducacionBase.includes(opcionNormalizada) && !this.opcionesPersonalizadasEducacion.includes(opcionNormalizada)) {
      this.opcionesPersonalizadasEducacion.push(opcionNormalizada);
      this.reconstruirListaNivelesEducacion();
      
      const valorActual = this.perfilForm.get('nivel_educacion')?.value || [];
      this.perfilForm.get('nivel_educacion')?.setValue([...valorActual, opcionNormalizada]);
      
      this.nuevaNivelEducacion = '';
      this.showAddNivelEducacionDialog = false;

      // Detectar cambios después de agregar
      this.detectFormChanges();

      this.messageService.add({
        severity: 'success',
        summary: 'Opción agregada',
        detail: `"${nuevaOpcion}" ha sido agregada y seleccionada`,
        life: 3000
      });
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Opción duplicada',
        detail: 'Esta opción de educación ya existe en las opciones disponibles',
        life: 3000
      });
    }
  }

  toggleAddNivelEducacion() {
    this.showAddNivelEducacionDialog = !this.showAddNivelEducacionDialog;
    if (!this.showAddNivelEducacionDialog) {
      this.nuevaNivelEducacion = '';
    }
  }

  onNuevaNivelEducacionChange(event: any) {
    this.nuevaNivelEducacion = event.target.value;
    this.cdr.detectChanges();
  }

  get isNuevaNivelEducacionValid(): boolean {
    return this.nuevaNivelEducacion.trim().length > 0;
  }

  cancelarAgregarNivelEducacion() {
    this.nuevaNivelEducacion = '';
    this.showAddNivelEducacionDialog = false;
  }

  onNivelEducacionChange(value: any) {
    // Manejar la lógica de "Sin especialización"
    if (value && value.includes('Sin especialización')) {
      // Si se selecciona "Sin especialización", deseleccionar todo lo demás
      this.perfilForm.get('nivel_educacion')?.setValue(['Sin especialización']);
    } else if (value && value.length > 1 && value.includes('Sin especialización')) {
      // Si hay otras opciones seleccionadas junto con "Sin especialización", remover "Sin especialización"
      const filteredValue = value.filter((v: string) => v !== 'Sin especialización');
      this.perfilForm.get('nivel_educacion')?.setValue(filteredValue);
    }
  }

  // Métodos para tecnologías personalizadas
  esOpcionPersonalizadaTecnologia(option: string): boolean {
    return this.opcionesPersonalizadasTecnologias.includes(option);
  }

  eliminarOpcionPersonalizadaTecnologia(option: string, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const index = this.opcionesPersonalizadasTecnologias.indexOf(option);
    if (index > -1) {
      this.opcionesPersonalizadasTecnologias.splice(index, 1);
    }
    
    this.reconstruirListaTecnologias();
    
    const valorActual = this.perfilForm.get('especialidad_tecnica')?.value || [];
    const nuevoValor = valorActual.filter((v: string) => v !== option);
    this.perfilForm.get('especialidad_tecnica')?.setValue(nuevoValor);

    this.messageService.add({
      severity: 'info',
      summary: 'Opción eliminada',
      detail: `"${option}" ha sido eliminada de las opciones personalizadas`,
      life: 3000
    });
  }

  agregarTecnologia() {
    const nuevaOpcion = this.nuevaTecnologia.trim();
    
    if (!nuevaOpcion) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campo vacío',
        detail: 'Por favor ingrese el nombre de la tecnología',
        life: 3000
      });
      return;
    }

    const opcionNormalizada = this.normalizeText(nuevaOpcion);

    if (!this.especialidadesTecnicasBase.includes(opcionNormalizada) && !this.opcionesPersonalizadasTecnologias.includes(opcionNormalizada)) {
      this.opcionesPersonalizadasTecnologias.push(opcionNormalizada);
      this.reconstruirListaTecnologias();
      
      const valorActual = this.perfilForm.get('especialidad_tecnica')?.value || [];
      this.perfilForm.get('especialidad_tecnica')?.setValue([...valorActual, opcionNormalizada]);
      
      this.nuevaTecnologia = '';
      this.showAddTecnologiaDialog = false;

      this.messageService.add({
        severity: 'success',
        summary: 'Opción agregada',
        detail: `"${nuevaOpcion}" ha sido agregada y seleccionada`,
        life: 3000
      });
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Opción duplicada',
        detail: 'Esta tecnología ya existe en las opciones disponibles',
        life: 3000
      });
    }
  }

  toggleAddTecnologia() {
    this.showAddTecnologiaDialog = !this.showAddTecnologiaDialog;
    if (!this.showAddTecnologiaDialog) {
      this.nuevaTecnologia = '';
    }
  }

  onNuevaTecnologiaChange(event: any) {
    this.nuevaTecnologia = event.target.value;
    this.cdr.detectChanges();
  }

  get isNuevaTecnologiaValid(): boolean {
    return this.nuevaTecnologia.trim().length > 0;
  }

  cancelarAgregarTecnologia() {
    this.nuevaTecnologia = '';
    this.showAddTecnologiaDialog = false;
  }

  onEspecialidadChange(value: any) {
    // Lógica adicional si es necesaria
  }

  // Métodos para área de interés personalizada
  esOpcionPersonalizadaAreaInteres(option: string): boolean {
    return this.opcionesPersonalizadasAreaInteres.includes(option);
  }

  eliminarOpcionPersonalizadaAreaInteres(option: string, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const index = this.opcionesPersonalizadasAreaInteres.indexOf(option);
    if (index > -1) {
      this.opcionesPersonalizadasAreaInteres.splice(index, 1);
    }
    
    this.reconstruirListaAreasInteres();
    
    const valorActual = this.perfilForm.get('area_interes')?.value || '';
    if (valorActual === option) {
      this.perfilForm.get('area_interes')?.setValue('');
    }

    this.messageService.add({
      severity: 'info',
      summary: 'Opción eliminada',
      detail: `"${option}" ha sido eliminada de las opciones personalizadas`,
      life: 3000
    });
  }

  agregarAreaInteres() {
    const nuevaOpcion = this.nuevaAreaInteres.trim();
    
    if (!nuevaOpcion) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campo vacío',
        detail: 'Por favor ingrese el nombre del área de interés',
        life: 3000
      });
      return;
    }

    const opcionNormalizada = this.normalizeText(nuevaOpcion);

    if (!this.areasInteresBase.includes(opcionNormalizada) && !this.opcionesPersonalizadasAreaInteres.includes(opcionNormalizada)) {
      this.opcionesPersonalizadasAreaInteres.push(opcionNormalizada);
      this.reconstruirListaAreasInteres();
      this.perfilForm.get('area_interes')?.setValue(opcionNormalizada);
      this.nuevaAreaInteres = '';
      this.showAddAreaInteresDialog = false;

      this.messageService.add({
        severity: 'success',
        summary: 'Opción agregada',
        detail: `"${nuevaOpcion}" ha sido agregada y seleccionada`,
        life: 3000
      });
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Opción duplicada',
        detail: 'Esta área de interés ya existe en las opciones disponibles',
        life: 3000
      });
    }
  }

  toggleAddAreaInteres() {
    this.showAddAreaInteresDialog = !this.showAddAreaInteresDialog;
    if (!this.showAddAreaInteresDialog) {
      this.nuevaAreaInteres = '';
    }
  }

  onNuevaAreaInteresChange(event: any) {
    this.nuevaAreaInteres = event.target.value;
    this.cdr.detectChanges();
  }

  get isNuevaAreaInteresValid(): boolean {
    return this.nuevaAreaInteres.trim().length > 0;
  }

  cancelarAgregarAreaInteres() {
    this.nuevaAreaInteres = '';
    this.showAddAreaInteresDialog = false;
  }

  // Métodos para industria personalizada
  esOpcionPersonalizadaIndustria(option: string): boolean {
    return this.opcionesPersonalizadasIndustria.includes(option);
  }

  eliminarOpcionPersonalizadaIndustria(option: string, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const index = this.opcionesPersonalizadasIndustria.indexOf(option);
    if (index > -1) {
      this.opcionesPersonalizadasIndustria.splice(index, 1);
    }
    
    this.reconstruirListaIndustrias();
    
    const valorActual = this.perfilForm.get('industria')?.value || '';
    if (valorActual === option) {
      this.perfilForm.get('industria')?.setValue('');
    }

    this.messageService.add({
      severity: 'info',
      summary: 'Opción eliminada',
      detail: `"${option}" ha sido eliminada de las opciones personalizadas`,
      life: 3000
    });
  }

  agregarIndustria() {
    const nuevaOpcion = this.nuevaIndustria.trim();
    
    if (!nuevaOpcion) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campo vacío',
        detail: 'Por favor ingrese el nombre de la industria',
        life: 3000
      });
      return;
    }

    const opcionNormalizada = this.normalizeText(nuevaOpcion);

    if (!this.industriasBase.includes(opcionNormalizada) && !this.opcionesPersonalizadasIndustria.includes(opcionNormalizada)) {
      this.opcionesPersonalizadasIndustria.push(opcionNormalizada);
      this.reconstruirListaIndustrias();
      this.perfilForm.get('industria')?.setValue(opcionNormalizada);
      this.nuevaIndustria = '';
      this.showAddIndustriaDialog = false;

      this.messageService.add({
        severity: 'success',
        summary: 'Opción agregada',
        detail: `"${nuevaOpcion}" ha sido agregada y seleccionada`,
        life: 3000
      });
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Opción duplicada',
        detail: 'Esta industria ya existe en las opciones disponibles',
        life: 3000
      });
    }
  }

  toggleAddIndustria() {
    this.showAddIndustriaDialog = !this.showAddIndustriaDialog;
    if (!this.showAddIndustriaDialog) {
      this.nuevaIndustria = '';
    }
  }

  onNuevaIndustriaChange(event: any) {
    this.nuevaIndustria = event.target.value;
    this.cdr.detectChanges();
  }

  get isNuevaIndustriaValid(): boolean {
    return this.nuevaIndustria.trim().length > 0;
  }

  cancelarAgregarIndustria() {
    this.nuevaIndustria = '';
    this.showAddIndustriaDialog = false;
  }

  // Métodos de validación
  isFieldInvalid(fieldName: string): boolean {
    const field = this.perfilForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.perfilForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) return 'Este campo es requerido';
      if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors['maxlength']) return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
      if (field.errors['email']) return 'Formato de email inválido';
      if (field.errors['min']) return `Valor mínimo: ${field.errors['min'].min}`;
      if (field.errors['max']) return `Valor máximo: ${field.errors['max'].max}`;
    }
    return '';
  }

  guardarPerfil() {
    if (this.perfilForm.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Formulario inválido',
        detail: 'Por favor complete todos los campos requeridos',
        life: 5000
      });
      return;
    }

    this.saving = true;
    const datosActualizados = this.perfilForm.value;

    // Normalizar campos de texto antes de enviar
    if (datosActualizados.empresa_actual) {
      datosActualizados.empresa_actual = this.normalizeText(datosActualizados.empresa_actual);
    }
    if (datosActualizados.industria) {
      datosActualizados.industria = this.normalizeText(datosActualizados.industria);
    }
    if (datosActualizados.area_interes) {
      datosActualizados.area_interes = this.normalizeText(datosActualizados.area_interes);
    }

    // Normalizar arrays de opciones personalizadas
    datosActualizados.opciones_personalizadas_educacion = this.opcionesPersonalizadasEducacion.map(opcion => this.normalizeText(opcion));
    datosActualizados.opciones_personalizadas_tecnologias = this.opcionesPersonalizadasTecnologias.map(opcion => this.normalizeText(opcion));
    datosActualizados.opciones_personalizadas_area_interes = this.opcionesPersonalizadasAreaInteres.map(opcion => this.normalizeText(opcion));
    datosActualizados.opciones_personalizadas_industria = this.opcionesPersonalizadasIndustria.map(opcion => this.normalizeText(opcion));

    // Llamar al servicio para actualizar el usuario
    this.authService.actualizarUsuario(this.usuario.id, datosActualizados)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.ok) {
            // Resetear estado de cambios después de guardar exitosamente
            this.saveInitialFormState();
            
            // Emitir evento para notificar que el usuario fue actualizado
            this.usuarioActualizado.emit(response.usuario);
            this.cerrarDialog();
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: response.msj || 'Error al actualizar el usuario'
            });
          }
          this.saving = false;
        },
        error: (error) => {
          console.error('Error al actualizar usuario:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al actualizar el usuario'
          });
          this.saving = false;
        }
      });
  }

  cerrarDialog() {
    this.visible = false;
    this.visibleChange.emit(false);
    this.perfilForm.reset();
    this.perfil = null;
    this.initialFormStateSaved = false;
    this.hasFormChanges = false;
  }

  cancelar() {
    this.cerrarDialog();
  }
}

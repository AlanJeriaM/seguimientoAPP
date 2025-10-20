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
  opciones_personalizadas_tecnologias?: string[];
  opciones_personalizadas_area_interes?: string[];
  opciones_personalizadas_industria?: string[];
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

  // Variables para modales de confirmación
  displaySaveDialog: boolean = false;
  displayDiscardDialog: boolean = false;
  savingChanges: boolean = false;

  // Variables para control de cambios en el formulario
  private formInitialValue: any = null;
  hasFormChanges = false; // Opciones personalizadas del usuario

  // Método para normalizar texto a minúsculas
  normalizeText(text: string): string {
    if (!text || typeof text !== 'string') return text;
    return text.trim().toLowerCase();
  }

  // Método para parsear campos que pueden venir como string JSON o array
  parseArrayField(field: any): any[] {
    if (!field) return [];

    // Si ya es un array, retornarlo
    if (Array.isArray(field)) {
      return field.filter(item => item !== null && item !== undefined && item !== '');
    }

    // Si es string, intentar parsearlo como JSON
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => item !== null && item !== undefined && item !== '');
        }
        // Si es un string simple, retornarlo como array de un elemento
        return field.trim() ? [field.trim()] : [];
      } catch (error) {
        // Si no es JSON válido, tratarlo como string simple
        return field.trim() ? [field.trim()] : [];
      }
    }

    return [];
  }

  // Progreso del perfil
  profileProgress = 0;

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
    'No seguro',
    'Sin trabajo'
  ];

  // Opciones base para área de interés (normalizadas para coincidir con datos del backend)
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

  // Array dinámico que combina opciones base + personalizadas
  areasInteres: string[] = [];

  // Opciones base para tecnologías (normalizadas para coincidir con datos del backend)
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
  especialidadesTecnicas: string[] = [];

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
    // Inicializar las listas
    this.reconstruirListaNivelesEducacion();
    this.reconstruirListaTecnologias();
    this.reconstruirListaAreasInteres();
    this.reconstruirListaIndustrias();

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

  ngAfterViewInit() {
    // Configurar listener para detectar cambios en el formulario
    if (this.perfilForm) {
      this.perfilForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.detectFormChanges();
      });
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Métodos para control de cambios en el formulario
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
    }
  }

  private detectFormChanges() {
    if (!this.formInitialValue || !this.perfilForm) {
      this.hasFormChanges = false;
      return;
    }

    const currentValue = this.perfilForm.value;
    this.hasFormChanges = this.hasRealChanges(this.formInitialValue, currentValue);
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

      // Para arrays (nivel_educacion, especialidad_tecnica)
      if (Array.isArray(initialValue) && Array.isArray(currentValue)) {
        if (initialValue.length !== currentValue.length) {
          return true;
        }
        // Comparar elementos del array
        for (let i = 0; i < initialValue.length; i++) {
          if (initialValue[i] !== currentValue[i]) {
            return true;
          }
        }
      }
      // Para otros campos
      else if (initialValue !== currentValue) {
        return true;
      }
    }

    // Comparar opciones personalizadas de educación
    const initialOpcionesEducacion = initial.opciones_personalizadas_educacion || [];
    const currentOpcionesEducacion = this.opcionesPersonalizadasEducacion || [];

    if (initialOpcionesEducacion.length !== currentOpcionesEducacion.length) {
      return true;
    }

    for (let i = 0; i < initialOpcionesEducacion.length; i++) {
      if (initialOpcionesEducacion[i] !== currentOpcionesEducacion[i]) {
        return true;
      }
    }

    // Comparar opciones personalizadas de tecnologías
    const initialOpcionesTecnologias = initial.opciones_personalizadas_tecnologias || [];
    const currentOpcionesTecnologias = this.opcionesPersonalizadasTecnologias || [];

    if (initialOpcionesTecnologias.length !== currentOpcionesTecnologias.length) {
      return true;
    }

    for (let i = 0; i < initialOpcionesTecnologias.length; i++) {
      if (initialOpcionesTecnologias[i] !== currentOpcionesTecnologias[i]) {
        return true;
      }
    }

    // Comparar opciones personalizadas de área de interés
    const initialOpcionesAreaInteres = initial.opciones_personalizadas_area_interes || [];
    const currentOpcionesAreaInteres = this.opcionesPersonalizadasAreaInteres || [];

    if (initialOpcionesAreaInteres.length !== currentOpcionesAreaInteres.length) {
      return true;
    }

    for (let i = 0; i < initialOpcionesAreaInteres.length; i++) {
      if (initialOpcionesAreaInteres[i] !== currentOpcionesAreaInteres[i]) {
        return true;
      }
    }

    // Comparar opciones personalizadas de industria
    const initialOpcionesIndustria = initial.opciones_personalizadas_industria || [];
    const currentOpcionesIndustria = this.opcionesPersonalizadasIndustria || [];

    if (initialOpcionesIndustria.length !== currentOpcionesIndustria.length) {
      return true;
    }

    for (let i = 0; i < initialOpcionesIndustria.length; i++) {
      if (initialOpcionesIndustria[i] !== currentOpcionesIndustria[i]) {
        return true;
      }
    }

    return false;
  }

  // Métodos para manejar opciones personalizadas
  esOpcionPersonalizada(option: string): boolean {
    return this.opcionesPersonalizadasEducacion.includes(option);
  }

  esOpcionPersonalizadaTecnologia(option: string): boolean {
    return this.opcionesPersonalizadasTecnologias.includes(option);
  }

  reconstruirListaNivelesEducacion() {
    // Combinar opciones base con opciones personalizadas
    this.nivelesEducacion = [...this.nivelesEducacionBase, ...this.opcionesPersonalizadasEducacion];
  }

  reconstruirListaTecnologias() {
    // Combinar opciones base con opciones personalizadas
    this.especialidadesTecnicas = [...this.especialidadesTecnicasBase, ...this.opcionesPersonalizadasTecnologias];
    console.log('Reconstruyendo lista de tecnologías:', {
      especialidadesTecnicasBase: this.especialidadesTecnicasBase,
      opcionesPersonalizadasTecnologias: this.opcionesPersonalizadasTecnologias,
      especialidadesTecnicasFinal: this.especialidadesTecnicas
    });
  }

  reconstruirListaAreasInteres() {
    // Combinar opciones base con opciones personalizadas
    console.log('Reconstruyendo lista de áreas de interés:', {
      areasInteresBase: this.areasInteresBase,
      opcionesPersonalizadasAreaInteres: this.opcionesPersonalizadasAreaInteres
    });
    this.areasInteres = [...this.areasInteresBase, ...this.opcionesPersonalizadasAreaInteres];
    console.log('Lista final de áreas de interés:', this.areasInteres);
  }

  reconstruirListaIndustrias() {
    // Combinar opciones base con opciones personalizadas
    console.log('Reconstruyendo lista de industrias:', {
      industriasBase: this.industriasBase,
      opcionesPersonalizadasIndustria: this.opcionesPersonalizadasIndustria
    });
    this.industriasOpciones = [...this.industriasBase, ...this.opcionesPersonalizadasIndustria];
    console.log('Lista final de industrias:', this.industriasOpciones);
  }

  eliminarOpcionPersonalizada(option: string, event: Event) {
    // Prevenir todos los eventos de propagación
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    console.log('Eliminando opción personalizada:', option);

    // Verificar que la opción existe antes de eliminar
    if (!this.opcionesPersonalizadasEducacion.includes(option)) {
      console.log('Opción no encontrada en opciones personalizadas');
      return;
    }

    // Remover de opciones personalizadas
    const index = this.opcionesPersonalizadasEducacion.indexOf(option);
    if (index > -1) {
      this.opcionesPersonalizadasEducacion.splice(index, 1);
      console.log('Opción removida de opciones personalizadas');
    }

    // Reconstruir la lista completa sin la opción eliminada
    this.reconstruirListaNivelesEducacion();
    console.log('Lista reconstruida:', this.nivelesEducacion);

    // Deseleccionar si estaba seleccionada
    const valoresActuales = this.perfilForm.get('nivel_educacion')?.value || [];
    const valoresSinEliminada = valoresActuales.filter((valor: string) => valor !== option);
    this.perfilForm.get('nivel_educacion')?.setValue(valoresSinEliminada);
    console.log('Valores actualizados:', valoresSinEliminada);

    // Forzar detección de cambios
    this.cdr.detectChanges();

    // Guardar cambios
    this.guardarOpcionesPersonalizadas();

    // Detectar cambios después de eliminar opción
    this.detectFormChanges();

    // Mostrar mensaje de confirmación
    this.messageService.add({
      severity: 'success',
      summary: 'Opción eliminada',
      detail: `"${option}" ha sido eliminada de tus opciones personalizadas`
    });
  }

  eliminarOpcionPersonalizadaTecnologia(option: string, event: Event) {
    // Prevenir todos los eventos de propagación
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    console.log('Eliminando opción personalizada de tecnología:', option);

    // Verificar que la opción existe antes de eliminar
    if (!this.opcionesPersonalizadasTecnologias.includes(option)) {
      console.log('Opción no encontrada en opciones personalizadas de tecnologías');
      return;
    }

    // Remover de opciones personalizadas
    const index = this.opcionesPersonalizadasTecnologias.indexOf(option);
    if (index > -1) {
      this.opcionesPersonalizadasTecnologias.splice(index, 1);
      console.log('Opción removida de opciones personalizadas de tecnologías');
    }

    // Reconstruir la lista completa sin la opción eliminada
    this.reconstruirListaTecnologias();
    console.log('Lista de tecnologías reconstruida:', this.especialidadesTecnicas);

    // Deseleccionar si estaba seleccionada
    const valoresActuales = this.perfilForm.get('especialidad_tecnica')?.value || [];
    const valoresSinEliminada = valoresActuales.filter((valor: string) => valor !== option);
    this.perfilForm.get('especialidad_tecnica')?.setValue(valoresSinEliminada);
    console.log('Valores de tecnologías actualizados:', valoresSinEliminada);

    // Forzar detección de cambios
    this.cdr.detectChanges();

    // Guardar cambios
    this.guardarOpcionesPersonalizadasTecnologias();

    // Detectar cambios después de eliminar opción
    this.detectFormChanges();

    // Mostrar mensaje de confirmación
    this.messageService.add({
      severity: 'success',
      summary: 'Opción eliminada',
      detail: `"${option}" ha sido eliminada de tus opciones personalizadas`
    });
  }

  // Métodos para manejar campos "otro"
  onNivelEducacionChange(selectedValues: string[]) {
    console.log('Valores seleccionados:', selectedValues);

    // Usar setTimeout para asegurar que el cambio se aplique después del procesamiento del multiselect
    setTimeout(() => {
      const currentValues = this.perfilForm.get('nivel_educacion')?.value || [];
      console.log('Valores actuales después del timeout:', currentValues);

      // Si "sin especialización" está seleccionada junto con otras opciones, limpiar
      if (currentValues.includes('sin especialización') && currentValues.length > 1) {
        console.log('Detección: sin especialización con otras opciones, limpiando...');
        // Si se está intentando seleccionar otra opción, mantener solo esa opción
        const ultimaOpcion = selectedValues[selectedValues.length - 1];
        if (ultimaOpcion && ultimaOpcion !== 'sin especialización') {
          this.perfilForm.get('nivel_educacion')?.setValue([ultimaOpcion]);
        } else {
          // Si se está deseleccionando, mantener solo "sin especialización"
          this.perfilForm.get('nivel_educacion')?.setValue(['sin especialización']);
        }
      }
      // Si se selecciona "sin especialización" sola, deseleccionar todas las demás
      else if (selectedValues.includes('sin especialización') && selectedValues.length === 1) {
        console.log('Detección: Solo sin especialización seleccionada');
        this.perfilForm.get('nivel_educacion')?.setValue(['sin especialización']);
      }
    }, 0);

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
      const opcionNormalizada = this.normalizeText(nuevaOpcion);

      // Verificar que no exista ya (comparar con versiones normalizadas)
      const nivelesBaseNormalizados = this.nivelesEducacionBase.map(n => this.normalizeText(n));
      const opcionesPersonalizadasNormalizadas = this.opcionesPersonalizadasEducacion.map(n => this.normalizeText(n));

      if (!nivelesBaseNormalizados.includes(opcionNormalizada) && !opcionesPersonalizadasNormalizadas.includes(opcionNormalizada)) {
        // Agregar a opciones personalizadas (guardar normalizado)
        this.opcionesPersonalizadasEducacion.push(opcionNormalizada);

        // Reconstruir la lista completa
        this.reconstruirListaNivelesEducacion();

        // Agregar la nueva opción a la selección actual
        const valoresActuales = this.perfilForm.get('nivel_educacion')?.value || [];

        // Si "sin especialización" está seleccionada, deseleccionarla antes de agregar la nueva opción
        const valoresSinEspecializacion = valoresActuales.filter((valor: string) => valor !== 'sin especialización');
        this.perfilForm.get('nivel_educacion')?.setValue([...valoresSinEspecializacion, opcionNormalizada]);

        // Limpiar y cerrar el diálogo
        this.cancelarAgregarNivelEducacion();

        // Guardar las opciones personalizadas en el perfil
        this.guardarOpcionesPersonalizadas();

        // Detectar cambios después de agregar opción
        this.detectFormChanges();
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

  toggleAddNivelEducacion() {
    this.showAddNivelEducacionDialog = !this.showAddNivelEducacionDialog;
  }

  // goToPerfil() {
  //     this.router.navigate(['/user/mi-perfil']);
  // }

  cancelarAgregarNivelEducacion() {
    this.nuevaNivelEducacion = '';
    this.showAddNivelEducacionDialog = false;
  }

  // Métodos para agregar opciones personalizadas de tecnologías
  agregarTecnologia() {
    if (this.nuevaTecnologia?.trim()) {
      const nuevaOpcion = this.nuevaTecnologia.trim();
      const opcionNormalizada = this.normalizeText(nuevaOpcion);

      // Verificar que no exista ya (comparar con versiones normalizadas)
      const especialidadesBaseNormalizadas = this.especialidadesTecnicasBase.map(t => this.normalizeText(t));
      const opcionesPersonalizadasNormalizadas = this.opcionesPersonalizadasTecnologias.map(t => this.normalizeText(t));

      if (!especialidadesBaseNormalizadas.includes(opcionNormalizada) && !opcionesPersonalizadasNormalizadas.includes(opcionNormalizada)) {
        // Agregar a opciones personalizadas (guardar normalizado)
        this.opcionesPersonalizadasTecnologias.push(opcionNormalizada);

        // Reconstruir la lista completa
        this.reconstruirListaTecnologias();

        // Agregar la nueva opción a la selección actual
        const valoresActuales = this.perfilForm.get('especialidad_tecnica')?.value || [];
        this.perfilForm.get('especialidad_tecnica')?.setValue([...valoresActuales, opcionNormalizada]);

        // Limpiar y cerrar el diálogo
        this.cancelarAgregarTecnologia();

        // Guardar las opciones personalizadas en el perfil
        this.guardarOpcionesPersonalizadasTecnologias();

        // Detectar cambios después de agregar opción
        this.detectFormChanges();
      } else {
        // Mostrar mensaje de que ya existe
        this.messageService.add({
          severity: 'warn',
          summary: 'Opción existente',
          detail: 'Esta tecnología ya existe en la lista'
        });
      }
    }
  }

  toggleAddTecnologia() {
    this.showAddTecnologiaDialog = !this.showAddTecnologiaDialog;
  }

  onNuevaTecnologiaChange(event: any) {
    this.nuevaTecnologia = event.target.value;
    this.cdr.detectChanges();
  }

  get isNuevaTecnologiaValid(): boolean {
    return this.nuevaTecnologia.trim() !== '';
  }

  cancelarAgregarTecnologia() {
    this.showAddTecnologiaDialog = false;
    this.nuevaTecnologia = '';
  }

  // Métodos para área de interés personalizada
  esOpcionPersonalizadaAreaInteres(option: string): boolean {
    return this.opcionesPersonalizadasAreaInteres.includes(option);
  }

  eliminarOpcionPersonalizadaAreaInteres(option: string, event: Event) {
    // Prevenir todos los eventos de propagación
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    console.log('Eliminando opción personalizada de área de interés:', option);

    // Verificar que la opción existe antes de eliminar
    if (!this.opcionesPersonalizadasAreaInteres.includes(option)) {
      console.log('Opción no encontrada en opciones personalizadas de área de interés');
      return;
    }

    // Remover de opciones personalizadas
    const index = this.opcionesPersonalizadasAreaInteres.indexOf(option);
    if (index > -1) {
      this.opcionesPersonalizadasAreaInteres.splice(index, 1);
      console.log('Opción removida de opciones personalizadas de área de interés');
    }

    // Reconstruir la lista completa sin la opción eliminada
    this.reconstruirListaAreasInteres();
    console.log('Lista de áreas de interés reconstruida:', this.areasInteres);

    // Deseleccionar si estaba seleccionada
    const valorActual = this.perfilForm.get('area_interes')?.value || '';
    if (valorActual === option) {
      this.perfilForm.get('area_interes')?.setValue('');
      console.log('Área de interés deseleccionada');
    }

    // Forzar detección de cambios
    this.cdr.detectChanges();

    // Guardar cambios
    this.guardarOpcionesPersonalizadasAreaInteres();

    // Mostrar mensaje de confirmación
    this.messageService.add({
      severity: 'success',
      summary: 'Opción eliminada',
      detail: `"${option}" ha sido eliminada de tus opciones personalizadas`
    });
  }

  agregarAreaInteres() {
    const nuevaOpcion = this.nuevaAreaInteres.trim();

    if (!nuevaOpcion) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campo vacío',
        detail: 'Por favor ingresa un área de interés'
      });
      return;
    }

    // Normalizar la nueva opción
    const opcionNormalizada = this.normalizeText(nuevaOpcion);

    // Verificar que no existe ya (comparar con versiones normalizadas)
    const areasInteresBaseNormalizadas = this.areasInteresBase.map(a => this.normalizeText(a));
    const opcionesPersonalizadasNormalizadas = this.opcionesPersonalizadasAreaInteres.map(a => this.normalizeText(a));

    if (!areasInteresBaseNormalizadas.includes(opcionNormalizada) && !opcionesPersonalizadasNormalizadas.includes(opcionNormalizada)) {
      // Agregar a opciones personalizadas (guardar normalizado)
      this.opcionesPersonalizadasAreaInteres.push(opcionNormalizada);

      // Reconstruir la lista completa
      this.reconstruirListaAreasInteres();

      // Seleccionar la nueva opción
      this.perfilForm.get('area_interes')?.setValue(opcionNormalizada);

      // Limpiar el campo y cerrar el diálogo
      this.nuevaAreaInteres = '';
      this.showAddAreaInteresDialog = false;

      // Guardar cambios
      this.guardarOpcionesPersonalizadasAreaInteres();

      // Detectar cambios
      this.detectFormChanges();

      this.messageService.add({
        severity: 'success',
        summary: 'Opción agregada',
        detail: `"${opcionNormalizada}" ha sido agregada a tus opciones personalizadas`
      });
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Opción duplicada',
        detail: 'Esta área de interés ya existe'
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
    return this.nuevaAreaInteres.trim() !== '';
  }

  cancelarAgregarAreaInteres() {
    this.nuevaAreaInteres = '';
    this.showAddAreaInteresDialog = false;
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

  private guardarOpcionesPersonalizadasTecnologias() {
    if (this.perfil) {
      this.perfil.opciones_personalizadas_tecnologias = [...this.opcionesPersonalizadasTecnologias];
    }
  }

  private guardarOpcionesPersonalizadasAreaInteres() {
    if (this.perfil) {
      this.perfil.opciones_personalizadas_area_interes = [...this.opcionesPersonalizadasAreaInteres];
    }
  }

  // Métodos para industria personalizada
  esOpcionPersonalizadaIndustria(option: string): boolean {
    return this.opcionesPersonalizadasIndustria.includes(option);
  }

  eliminarOpcionPersonalizadaIndustria(option: string, event: Event) {
    // Prevenir todos los eventos de propagación
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    console.log('Eliminando opción personalizada de industria:', option);

    // Verificar que la opción existe antes de eliminar
    if (!this.opcionesPersonalizadasIndustria.includes(option)) {
      console.log('Opción no encontrada en opciones personalizadas de industria');
      return;
    }

    // Remover de opciones personalizadas
    const index = this.opcionesPersonalizadasIndustria.indexOf(option);
    if (index > -1) {
      this.opcionesPersonalizadasIndustria.splice(index, 1);
      console.log('Opción removida de opciones personalizadas de industria');
    }

    // Reconstruir la lista completa sin la opción eliminada
    this.reconstruirListaIndustrias();
    console.log('Lista de industrias reconstruida:', this.industriasOpciones);

    // Deseleccionar si estaba seleccionada
    const valorActual = this.perfilForm.get('industria')?.value || '';
    if (valorActual === option) {
      this.perfilForm.get('industria')?.setValue('');
    }

    // Guardar cambios
    this.guardarOpcionesPersonalizadasIndustria();

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

    // Normalizar la nueva opción
    const opcionNormalizada = this.normalizeText(nuevaOpcion);

    // Verificar que no existe ya (comparar con versiones normalizadas)
    const industriasBaseNormalizadas = this.industriasBase.map(i => this.normalizeText(i));
    const opcionesPersonalizadasNormalizadas = this.opcionesPersonalizadasIndustria.map(i => this.normalizeText(i));

    if (!industriasBaseNormalizadas.includes(opcionNormalizada) && !opcionesPersonalizadasNormalizadas.includes(opcionNormalizada)) {
      // Agregar a opciones personalizadas (guardar normalizado)
      this.opcionesPersonalizadasIndustria.push(opcionNormalizada);

      // Reconstruir la lista completa
      this.reconstruirListaIndustrias();

      // Seleccionar la nueva opción
      this.perfilForm.get('industria')?.setValue(opcionNormalizada);

      // Limpiar el campo y cerrar el diálogo
      this.nuevaIndustria = '';
      this.showAddIndustriaDialog = false;

      // Guardar cambios
      this.guardarOpcionesPersonalizadasIndustria();

      this.messageService.add({
        severity: 'success',
        summary: 'Opción agregada',
        detail: `"${opcionNormalizada}" ha sido agregada y seleccionada`,
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

  private guardarOpcionesPersonalizadasIndustria() {
    if (this.perfil) {
      this.perfil.opciones_personalizadas_industria = [...this.opcionesPersonalizadasIndustria];
    }
  }

  // Calcular progreso del perfil
  calculateProfileProgress(): number {
    if (!this.perfilForm) return 0;

    const requiredFields = [
      'nombre',
      'posicion_actual',
      'empresa_actual',
      'ubicacion',
      'industria',
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
      // Ya no hay campos opcionales, todos son requeridos
    ];


    let completedRequired = 0;
    let completedOptional = 0;

    // Evaluar todos los campos como obligatorios (100% del progreso)
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

    // Ya no hay campos opcionales, todos son requeridos
    // Calcular progreso basado en campos requeridos completados (100%)
    const finalProgress = Math.round((completedRequired / requiredFields.length) * 100);

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
          console.log('Respuesta del servidor:', response);
          if (response.ok) {
            this.perfil = response.usuario;
            console.log('Perfil cargado:', this.perfil);
            console.log('Opciones personalizadas de tecnologías en respuesta:', this.perfil?.opciones_personalizadas_tecnologias);
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
      this.opcionesPersonalizadasEducacion = this.parseArrayField(this.perfil.opciones_personalizadas_educacion);
      this.opcionesPersonalizadasTecnologias = this.parseArrayField(this.perfil.opciones_personalizadas_tecnologias);
      this.opcionesPersonalizadasAreaInteres = this.parseArrayField(this.perfil.opciones_personalizadas_area_interes);
      this.opcionesPersonalizadasIndustria = this.parseArrayField(this.perfil.opciones_personalizadas_industria);

      console.log('Opciones personalizadas de tecnologías cargadas:', this.opcionesPersonalizadasTecnologias);
      console.log('Opciones personalizadas de área de interés cargadas:', this.opcionesPersonalizadasAreaInteres);
      console.log('Opciones personalizadas de industria cargadas:', this.opcionesPersonalizadasIndustria);

      console.log('Estado después de cargar opciones personalizadas:', {
        opcionesPersonalizadasAreaInteres: this.opcionesPersonalizadasAreaInteres,
        areasInteres: this.areasInteres,
        opcionesPersonalizadasIndustria: this.opcionesPersonalizadasIndustria,
        industriasOpciones: this.industriasOpciones
      });

      // Reconstruir las listas completas
      this.reconstruirListaNivelesEducacion();
      this.reconstruirListaTecnologias();
      this.reconstruirListaAreasInteres();
      this.reconstruirListaIndustrias();

      // Parsear campos de array antes de asignar al formulario
      const nivelEducacionParsed = this.parseArrayField(this.perfil.nivel_educacion) || [];
      const especialidadTecnicaParsed = this.parseArrayField(this.perfil.especialidad_tecnica) || [];
      const tecnologiasPrincipalesParsed = this.parseArrayField(this.perfil.tecnologias_principales) || [];

      console.log('Debug - Campos parseados del backend:', {
        nivel_educacion_raw: this.perfil.nivel_educacion,
        nivel_educacion_parsed: nivelEducacionParsed,
        especialidad_tecnica_raw: this.perfil.especialidad_tecnica,
        especialidad_tecnica_parsed: especialidadTecnicaParsed,
        tecnologias_principales_raw: this.perfil.tecnologias_principales,
        tecnologias_principales_parsed: tecnologiasPrincipalesParsed
      });

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
        nivel_educacion: nivelEducacionParsed,
        especialidad_tecnica: especialidadTecnicaParsed,
        tipo_empleo_actual: this.perfil.tipo_empleo_actual || '',
        disponibilidad_cambio: this.perfil.disponibilidad_cambio || '',
        area_interes: this.perfil.area_interes || '',
        rango_salarial: this.perfil.rango_salarial || '',
        tecnologias_principales: tecnologiasPrincipalesParsed,
        satisfaccion_laboral: this.perfil.satisfaccion_laboral || ''
      });

      // Guardar el estado inicial del formulario para detectar cambios
      this.saveInitialFormState();
    }
  }

  onSubmit() {
    if (this.perfilForm.valid) {
      this.confirmSaveChanges();
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

    // Normalizar campos críticos para evitar duplicados en gráficos
    if (datosActualizados.empresa_actual) {
      datosActualizados.empresa_actual = this.normalizeText(datosActualizados.empresa_actual);
    }
    if (datosActualizados.industria) {
      datosActualizados.industria = this.normalizeText(datosActualizados.industria);
    }
    if (datosActualizados.area_interes) {
      datosActualizados.area_interes = this.normalizeText(datosActualizados.area_interes);
    }

    // Normalizar opciones personalizadas
    datosActualizados.opciones_personalizadas_educacion = this.opcionesPersonalizadasEducacion.map(opt => this.normalizeText(opt));
    datosActualizados.opciones_personalizadas_tecnologias = this.opcionesPersonalizadasTecnologias.map(opt => this.normalizeText(opt));
    datosActualizados.opciones_personalizadas_area_interes = this.opcionesPersonalizadasAreaInteres.map(opt => this.normalizeText(opt));
    datosActualizados.opciones_personalizadas_industria = this.opcionesPersonalizadasIndustria.map(opt => this.normalizeText(opt));

    console.log('Datos que se van a guardar:', datosActualizados);
    console.log('Opciones personalizadas de educación:', this.opcionesPersonalizadasEducacion);
    console.log('Opciones personalizadas de tecnologías:', this.opcionesPersonalizadasTecnologias);
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
            // Preservar fecha_registro del perfil anterior si no viene en la respuesta
            const fechaRegistroAnterior = this.perfil?.fecha_registro;

            this.perfil = response.usuario;
            if (this.perfil) {
              // Si la fecha_registro no viene en la respuesta o es null, usar la anterior
              if (!this.perfil.fecha_registro && fechaRegistroAnterior) {
                this.perfil.fecha_registro = fechaRegistroAnterior;
                console.log('Fecha de registro preservada:', this.perfil.fecha_registro);
              }

              console.log('Perfil actualizado recibido:', {
                posicion_actual: this.perfil.posicion_actual,
                empresa_actual: this.perfil.empresa_actual,
                ubicacion: this.perfil.ubicacion,
                industria: this.perfil.industria,
                fecha_registro: this.perfil.fecha_registro
              });
            }
            
            // Solo mostrar mensaje de actualización si NO está en modo completar perfil
            if (!this.isCompletionMode) {
              this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Perfil actualizado correctamente'
              });
            }

            // Actualizar solo los campos específicos que pueden haber cambiado
            if (this.perfil) {
              this.perfilForm.patchValue({
                posicion_actual: this.perfil.posicion_actual === 'No especificada' ? '' : this.perfil.posicion_actual,
                empresa_actual: this.perfil.empresa_actual === 'No especificada' ? '' : this.perfil.empresa_actual,
                ubicacion: this.perfil.ubicacion === 'No especificada' ? '' : this.perfil.ubicacion,
                industria: this.perfil.industria === 'No especificada' ? '' : this.perfil.industria,
                años_experiencia: this.perfil.años_experiencia != null ? this.perfil.años_experiencia : null,
                tipo_empleo_actual: this.perfil.tipo_empleo_actual || '',
                disponibilidad_cambio: this.perfil.disponibilidad_cambio || '',
                area_interes: this.perfil.area_interes || '',
                rango_salarial: this.perfil.rango_salarial || '',
                satisfaccion_laboral: this.perfil.satisfaccion_laboral || null
              });
            }

            // Resetear el estado de cambios después de guardar exitosamente
            this.saveInitialFormState();

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
    // Mostrar modal de confirmación antes de descartar
    this.confirmDiscardChanges();
  }

  private confirmDiscardChanges() {
    this.displayDiscardDialog = true;
  }

  // Confirmar descartar cambios
  confirmarDescartar() {
    this.populateForm();
    this.hasFormChanges = false;
    this.displayDiscardDialog = false;

    this.messageService.add({
      severity: 'info',
      summary: 'Cambios descartados',
      detail: 'Se han restaurado los valores originales',
      life: 3000
    });
  }

  // Cancelar descartar cambios
  cancelarDescartar() {
    this.displayDiscardDialog = false;
  }

  private confirmSaveChanges() {
    this.displaySaveDialog = true;
  }

  // Confirmar guardar cambios
  confirmarGuardar() {
    this.displaySaveDialog = false;
    this.guardarPerfil();
  }

  // Cancelar guardar cambios
  cancelarGuardar() {
    this.displaySaveDialog = false;
  }

  getUserInitials(): string {
    if (!this.perfil?.nombre) return 'US';
    const names = this.perfil.nombre.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }

  getFormattedDate(date: Date | null | undefined): string {
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

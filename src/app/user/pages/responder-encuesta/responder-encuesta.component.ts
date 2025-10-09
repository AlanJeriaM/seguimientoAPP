import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { Subject, takeUntil, interval } from 'rxjs';
import { MessageService, ConfirmationService } from 'primeng/api';
import { RespuestaService, EncuestaParaResponder, PreguntaParaResponder, RespuestaUsuario } from '../../../core/services/respuesta/respuesta.service';

@Component({
  selector: 'app-responder-encuesta',
  templateUrl: './responder-encuesta.component.html',
  styleUrls: ['./responder-encuesta.component.css']
})
export class ResponderEncuestaComponent implements OnInit, OnDestroy {
  
  encuestaId!: number;
  encuesta?: EncuestaParaResponder;
  formularioRespuestas!: FormGroup;
  sessionToken?: string;
  
  // Estados
  loading = false;
  enviando = false;
  formularioDeshabilitado = false;
  preguntaActual = 0;
  totalPreguntas = 0;
  progreso = 0;
  tiempoInicio?: Date;
  displayConfirmDialog = false;
  
  // Auto-guardado
  private autoGuardado$ = interval(30000); // Cada 30 segundos
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private respuestaService: RespuestaService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.encuestaId = +params['id'];
      if (this.encuestaId) {
        this.cargarEncuesta();
      }
    });

    // Auto-guardado cada 30 segundos
    this.autoGuardado$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.formularioRespuestas && !this.enviando) {
        this.guardarProgresoAutomatico();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarEncuesta(): void {
    this.loading = true;
    
    this.respuestaService.obtenerEncuestaParaResponder(this.encuestaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.ok && response.data && response.data.encuesta) {
            this.encuesta = response.data.encuesta;
            this.sessionToken = response.data.session_token;
            this.totalPreguntas = this.encuesta.preguntas.length;
            this.tiempoInicio = new Date();
            
            // Validar que las preguntas tengan opciones cuando es necesario
            this.encuesta.preguntas.forEach(pregunta => {
              if (pregunta.tipo === 'OPCION_UNICA' || pregunta.tipo === 'OPCION_MULTIPLE') {
                if (!pregunta.opciones || !Array.isArray(pregunta.opciones) || pregunta.opciones.length === 0) {
                  console.warn(`Pregunta "${pregunta.texto}" de tipo ${pregunta.tipo} no tiene opciones definidas`);
                  pregunta.opciones = [];
                }
              }
            });
            
            this.inicializarFormulario();
            console.log('Encuesta cargada:', this.encuesta);
            console.log('Session token:', this.sessionToken);
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al cargar encuesta:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cargar la encuesta'
          });
          this.loading = false;
        }
      });
  }

  inicializarFormulario(): void {
    if (!this.encuesta) return;

    const respuestasArray = this.formBuilder.array(
      this.encuesta.preguntas.map(pregunta => this.crearControlPregunta(pregunta))
    );

    this.formularioRespuestas = this.formBuilder.group({
      respuestas: respuestasArray
    });

    // Detectar cambios para actualizar progreso
    this.formularioRespuestas.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.actualizarProgreso();
    });
  }

  crearControlPregunta(pregunta: PreguntaParaResponder): FormGroup {
    const validators = pregunta.es_requerida ? [Validators.required] : [];

    switch (pregunta.tipo) {
      case 'TEXTO_CORTO':
      case 'TEXTO_LARGO':
        return this.formBuilder.group({
          pregunta_id: [pregunta.id],
          respuesta: ['', validators],
          tipo: [pregunta.tipo]
        });

      case 'OPCION_UNICA':
        return this.formBuilder.group({
          pregunta_id: [pregunta.id],
          respuesta: ['', validators],
          tipo: [pregunta.tipo],
          opciones: [pregunta.opciones || []]
        });

      case 'OPCION_MULTIPLE':
        // Crear controles independientes para cada opción
        const opcionesControls = (pregunta.opciones || []).map(() => 
          this.formBuilder.control(false)
        );
        return this.formBuilder.group({
          pregunta_id: [pregunta.id],
          respuesta: [[]],
          tipo: [pregunta.tipo],
          opciones: [pregunta.opciones || []],
          selecciones: this.formBuilder.array(opcionesControls)
        });

      case 'ESCALA':
        const config = pregunta.configuracion || {};
        return this.formBuilder.group({
          pregunta_id: [pregunta.id],
          respuesta: [config.min_value || 1, validators],
          tipo: [pregunta.tipo],
          configuracion: [config]
        });

      case 'NUMERO':
        return this.formBuilder.group({
          pregunta_id: [pregunta.id],
          respuesta: [null, validators],
          tipo: [pregunta.tipo]
        });

      case 'FECHA':
        return this.formBuilder.group({
          pregunta_id: [pregunta.id],
          respuesta: [null, validators],
          tipo: [pregunta.tipo]
        });

      default:
        return this.formBuilder.group({
          pregunta_id: [pregunta.id],
          respuesta: ['', validators],
          tipo: [pregunta.tipo]
        });
    }
  }

  get respuestasArray(): FormArray {
    return this.formularioRespuestas.get('respuestas') as FormArray;
  }

  getPreguntaControl(index: number): FormGroup {
    return this.respuestasArray.at(index) as FormGroup;
  }

  // Navegación entre preguntas
  anteriorPregunta(): void {
    if (this.preguntaActual > 0) {
      this.preguntaActual--;
      this.cdr.detectChanges();
    }
  }

  siguientePregunta(): void {
    const controlActual = this.getPreguntaControl(this.preguntaActual);
    const preguntaActualData = this.encuesta?.preguntas[this.preguntaActual];
    
    // Si la pregunta no es requerida, permitir avanzar
    if (!preguntaActualData?.es_requerida) {
      if (this.preguntaActual < this.totalPreguntas - 1) {
        this.preguntaActual++;
      }
      return;
    }
    
    // Validar según el tipo de pregunta
    const tipo = controlActual.get('tipo')?.value;
    const respuesta = controlActual.get('respuesta')?.value;
    let esValida = false;
    
    switch (tipo) {
      case 'TEXTO_CORTO':
      case 'TEXTO_LARGO':
        // Validar que el texto no esté vacío (sin contar espacios)
        esValida = typeof respuesta === 'string' && respuesta.trim() !== '';
        break;
        
      case 'OPCION_UNICA':
        // Validar que se haya seleccionado una opción
        esValida = respuesta !== null && respuesta !== undefined && respuesta !== '';
        break;
        
      case 'OPCION_MULTIPLE':
        // Validar que se haya seleccionado al menos una opción
        const selecciones = controlActual.get('selecciones') as FormArray;
        esValida = selecciones && selecciones.value.some((sel: boolean) => sel === true);
        break;
        
      case 'NUMERO':
        // Validar que se haya ingresado un número válido
        esValida = respuesta !== null && respuesta !== undefined && respuesta !== '' && !isNaN(respuesta);
        break;
        
      case 'ESCALA':
        // Para escala, siempre hay un valor por defecto
        esValida = respuesta !== null && respuesta !== undefined;
        break;
        
      case 'FECHA':
        // Validar que se haya seleccionado una fecha
        esValida = respuesta !== null && respuesta !== undefined;
        break;
        
      default:
        esValida = controlActual.valid;
    }
    
    if (esValida) {
      if (this.preguntaActual < this.totalPreguntas - 1) {
        this.preguntaActual++;
        this.cdr.detectChanges();
      }
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campo requerido',
        detail: 'Por favor responde esta pregunta antes de continuar'
      });
      controlActual.markAllAsTouched();
    }
  }

  // Progreso
  actualizarProgreso(): void {
    const respuestasCompletas = this.respuestasArray.controls.filter(control => {
      const tipo = control.get('tipo')?.value;
      const respuesta = control.get('respuesta')?.value;
      
      // Para OPCION_MULTIPLE, verificar si hay selecciones
      if (tipo === 'OPCION_MULTIPLE') {
        const selecciones = control.get('selecciones')?.value || [];
        return selecciones.some((sel: boolean) => sel === true);
      }
      
      // Para arrays (respuestas múltiples)
      if (Array.isArray(respuesta)) {
        return respuesta.length > 0;
      }
      
      // Para otros tipos, verificar que no esté vacío
      if (typeof respuesta === 'string') {
        return respuesta.trim() !== '';
      }
      
      // Para números y fechas
      return respuesta !== null && respuesta !== undefined && respuesta !== '';
    }).length;

    this.progreso = Math.round((respuestasCompletas / this.totalPreguntas) * 100);
    console.log(`Progreso actualizado: ${respuestasCompletas}/${this.totalPreguntas} = ${this.progreso}%`);
  }

  // Auto-guardado
  guardarProgresoAutomatico(): void {
    if (this.progreso > 0 && this.progreso < 100) {
      const respuestas = this.extraerRespuestas();
      
      this.respuestaService.guardarProgreso(this.encuestaId, respuestas).subscribe({
        next: () => {
          console.log('Progreso guardado automáticamente');
        },
        error: (error) => {
          console.error('Error al guardar progreso:', error);
        }
      });
    }
  }

  // Envío de respuestas
  enviarRespuestas(): void {
    if (!this.formularioRespuestas.valid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario incompleto',
        detail: 'Por favor completa todas las preguntas requeridas'
      });
      this.formularioRespuestas.markAllAsTouched();
      return;
    }

    this.displayConfirmDialog = true;
  }

  cancelarEnvio(): void {
    this.displayConfirmDialog = false;
  }

  confirmarEnvio(): void {
    this.displayConfirmDialog = false;
    this.procesarEnvio();
  }

  private procesarEnvio(): void {
    this.enviando = true;
    this.formularioDeshabilitado = true; // Deshabilitar formulario inmediatamente
    const respuestas = this.extraerRespuestas();

    this.respuestaService.enviarRespuestas(this.encuestaId, respuestas, this.sessionToken)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.ok) {
            this.messageService.add({
              severity: 'success',
              summary: '¡Completado!',
              detail: 'Tus respuestas han sido enviadas correctamente'
            });

            // Navegar a página de completado
            setTimeout(() => {
              this.router.navigate(['/user/encuesta-completada', this.encuestaId]);
            }, 2000);
          } else {
            // Si hay error, re-habilitar el formulario
            this.formularioDeshabilitado = false;
          }
          this.enviando = false;
        },
        error: (error) => {
          console.error('Error al enviar respuestas:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron enviar las respuestas. Inténtalo de nuevo.'
          });
          // Re-habilitar el formulario en caso de error
          this.formularioDeshabilitado = false;
          this.enviando = false;
        }
      });
  }

  extraerRespuestas(): RespuestaUsuario[] {
    const respuestas: RespuestaUsuario[] = [];

    this.respuestasArray.controls.forEach((control, index) => {
      const pregunta = this.encuesta!.preguntas[index];
      const formGroup = control as FormGroup;
      let respuestaValue = formGroup.get('respuesta')?.value;

      // Procesar según tipo de pregunta
      if (pregunta.tipo === 'OPCION_MULTIPLE') {
        const selecciones = formGroup.get('selecciones')?.value || [];
        const opciones = formGroup.get('opciones')?.value || [];
        respuestaValue = opciones.filter((_: string, i: number) => selecciones[i]);
      } else if (pregunta.tipo === 'FECHA' && respuestaValue) {
        respuestaValue = new Date(respuestaValue).toISOString();
      }

      if (respuestaValue !== null && respuestaValue !== '' && respuestaValue !== undefined) {
        respuestas.push({
          pregunta_id: pregunta.id,
          respuesta: Array.isArray(respuestaValue) ? respuestaValue.join(',') : String(respuestaValue),
          tiempo_respuesta: this.calcularTiempoRespuesta()
        });
      }
    });

    return respuestas;
  }

  private calcularTiempoRespuesta(): number {
    if (!this.tiempoInicio) return 0;
    return Math.floor((new Date().getTime() - this.tiempoInicio.getTime()) / 1000);
  }

  // Manejo de opciones múltiples
  onOpcionMultipleChange(preguntaIndex: number, opcionIndex: number, checked: boolean): void {
    const preguntaControl = this.getPreguntaControl(preguntaIndex);
    const seleccionesArray = preguntaControl.get('selecciones') as FormArray;
    seleccionesArray.at(opcionIndex).setValue(checked);

    // Actualizar el valor de respuesta
    const selecciones = seleccionesArray.value;
    const opciones = preguntaControl.get('opciones')?.value || [];
    const respuestasSeleccionadas = opciones.filter((_: string, i: number) => selecciones[i]);
    preguntaControl.get('respuesta')?.setValue(respuestasSeleccionadas);
  }

  // Utilidades
  salir(): void {
    if (this.progreso > 0) {
      this.confirmationService.confirm({
        message: 'Tienes progreso sin guardar. ¿Estás seguro de salir?',
        header: 'Confirmar salida',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.router.navigate(['/user/view-encuestas']);
        }
      });
    } else {
      this.router.navigate(['/user/view-encuestas']);
    }
  }

  getPorcentajeProgreso(): number {
    return this.progreso;
  }

  getPreguntaActualTexto(): string {
    return `${this.preguntaActual + 1} de ${this.totalPreguntas}`;
  }

  isPreguntaActualRespondida(): boolean {
    const controlActual = this.getPreguntaControl(this.preguntaActual);
    const tipo = controlActual.get('tipo')?.value;
    const respuesta = controlActual.get('respuesta')?.value;
    
    // Para OPCION_MULTIPLE, verificar si hay selecciones
    if (tipo === 'OPCION_MULTIPLE') {
      const selecciones = controlActual.get('selecciones')?.value || [];
      return selecciones.some((sel: boolean) => sel === true);
    }
    
    // Para arrays (respuestas múltiples)
    if (Array.isArray(respuesta)) {
      return respuesta.length > 0;
    }
    
    // Para strings, verificar que no esté vacío (con trim)
    if (typeof respuesta === 'string') {
      return respuesta.trim() !== '';
    }
    
    // Para números y fechas
    return respuesta !== null && respuesta !== undefined && respuesta !== '';
  }

  // TrackBy function para forzar recreación del DOM cuando cambia la pregunta
  trackByPreguntaIndex(index: number, item: number): number {
    return item; // Retorna el índice de la pregunta actual
  }
}
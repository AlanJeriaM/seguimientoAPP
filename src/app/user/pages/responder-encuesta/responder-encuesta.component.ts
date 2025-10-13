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
  tiempoInicioSesion?: Date; // Tiempo de inicio de esta sesión actual
  displayConfirmDialog = false;
  displayExitDialog = false;
  guardandoProgreso = false;

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
            this.tiempoInicioSesion = new Date(); // Registrar inicio de esta sesión

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

            // Cargar progreso guardado si existe
            if (response.data.progreso_guardado && response.data.progreso_guardado.respuestas.length > 0) {
              this.cargarProgresoGuardado(response.data.progreso_guardado);
            }

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
        const tiempoTranscurrido = this.calcularTiempoTranscurrido();

        this.respuestaService.guardarProgresoEncuesta(
          this.encuestaId,
          respuestas,
          this.sessionToken,
          this.preguntaActual,
          this.progreso,
          tiempoTranscurrido
        ).subscribe({
          next: () => {
            console.log('Progreso guardado automáticamente:', this.progreso + '%', 'Tiempo:', tiempoTranscurrido, 'seg');
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
    const tiempoTranscurrido = this.calcularTiempoTranscurrido();

    this.respuestaService.enviarRespuestas(this.encuestaId, respuestas, this.sessionToken, tiempoTranscurrido)
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

    console.log('Extrayendo respuestas del formulario...');

    this.respuestasArray.controls.forEach((control, index) => {
      const pregunta = this.encuesta!.preguntas[index];
      const formGroup = control as FormGroup;
      let respuestaValue = formGroup.get('respuesta')?.value;

      // Procesar según tipo de pregunta
      if (pregunta.tipo === 'OPCION_MULTIPLE') {
        const selecciones = formGroup.get('selecciones')?.value || [];
        const opciones = formGroup.get('opciones')?.value || [];
        respuestaValue = opciones.filter((_: string, i: number) => selecciones[i]);
        console.log(`  Pregunta ${index + 1} (Opción Múltiple):`, {
          selecciones: selecciones,
          opciones: opciones,
          respuestasFiltradas: respuestaValue
        });
      } else if (pregunta.tipo === 'FECHA' && respuestaValue) {
        respuestaValue = new Date(respuestaValue).toISOString();
      }

      // Validar que la respuesta tenga contenido
      const tieneContenido =
        respuestaValue !== null &&
        respuestaValue !== '' &&
        respuestaValue !== undefined &&
        (Array.isArray(respuestaValue) ? respuestaValue.length > 0 : true);

      if (tieneContenido) {
        const respuestaFormateada = Array.isArray(respuestaValue) ? respuestaValue.join(',') : String(respuestaValue);
        console.log(`  Pregunta ${index + 1} (ID: ${pregunta.id}): ${respuestaFormateada}`);
        respuestas.push({
          pregunta_id: pregunta.id,
          respuesta: respuestaFormateada,
          tiempo_respuesta: this.calcularTiempoRespuesta()
        });
      } else {
        console.log(` Pregunta ${index + 1} (ID: ${pregunta.id}): Sin respuesta`);
      }
    });

    console.log(`Total respuestas extraídas: ${respuestas.length}`);
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
    if (this.progreso > 0 && this.progreso < 100) {
      // Si hay progreso, mostrar modal para guardar
      this.displayExitDialog = true;
    } else {
      // Si no hay progreso o está completo, salir directamente
      this.router.navigate(['/user/view-encuestas']);
    }
  }

  cancelarSalida(): void {
    this.displayExitDialog = false;
  }

  salirSinGuardar(): void {
    this.displayExitDialog = false;
    this.router.navigate(['/user/view-encuestas']);
  }

  guardarYSalir(): void {
    this.guardandoProgreso = true;
    this.formularioDeshabilitado = true; // Deshabilitar formulario

    this.guardarProgreso().then(() => {
      console.log('Progreso guardado exitosamente');
      this.displayExitDialog = false;

      // Mostrar toast (ahora solo hay uno en navbar-shared con preventOpenDuplicates)
      this.messageService.add({
        severity: 'success',
        summary: 'Progreso guardado',
        detail: 'Continúa más tarde.'
      });

      // Redirigir después de un breve delay para que se vea el toast
      setTimeout(() => {
        this.router.navigate(['/user/view-encuestas']);
      }, 1000);
    }).catch((error) => {
      console.error('Error al guardar progreso:', error);
      this.guardandoProgreso = false;
      this.formularioDeshabilitado = false; // Rehabilitar formulario en caso de error
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo guardar el progreso. Inténtalo nuevamente.'
      });
    });
  }

  private async guardarProgreso(): Promise<void> {
    const respuestas = this.extraerRespuestas();
    const tiempoTranscurrido = this.calcularTiempoTranscurrido();

    console.log('Enviando al backend:');
    console.log('  - Encuesta ID:', this.encuestaId);
    console.log('  - Total respuestas:', respuestas.length);
    console.log('  - Progreso:', this.progreso + '%');
    console.log('  - Pregunta actual:', this.preguntaActual);
    console.log('  - Tiempo transcurrido:', tiempoTranscurrido, 'segundos');

    return new Promise((resolve, reject) => {
      this.respuestaService.guardarProgresoEncuesta(
        this.encuestaId,
        respuestas,
        this.sessionToken,
        this.preguntaActual,
        this.progreso,
        tiempoTranscurrido
      ).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          console.log('Respuesta del backend:', response);
          if (response.ok) {
            resolve();
          } else {
            reject(new Error(response.msj || 'Error al guardar'));
          }
        },
        error: (error) => {
          console.error('Error HTTP:', error);
          reject(error);
        }
      });
    });
  }

  private cargarProgresoGuardado(progresoData: any): void {
    console.log('cargarProgresoGuardado llamada');

    try {
      // Restaurar pregunta actual
      if (progresoData.pregunta_actual !== undefined) {
        this.preguntaActual = progresoData.pregunta_actual;
      }

      // Restaurar respuestas en el formulario
      if (progresoData.respuestas && Array.isArray(progresoData.respuestas)) {
        progresoData.respuestas.forEach((respuestaGuardada: any) => {
          const preguntaIndex = this.encuesta?.preguntas.findIndex(
            p => p.id === respuestaGuardada.pregunta_id
          );

          if (preguntaIndex !== undefined && preguntaIndex !== -1) {
            const control = this.getPreguntaControl(preguntaIndex);
            const pregunta = this.encuesta?.preguntas[preguntaIndex];

            if (pregunta?.tipo === 'OPCION_MULTIPLE') {
              // Para opciones múltiples, las respuestas vienen como string separado por comas
              try {
                let respuestasArray: string[];

                // Intentar parsear como JSON primero
                try {
                  respuestasArray = JSON.parse(respuestaGuardada.respuesta);
                } catch {
                  // Si no es JSON, separar por comas
                  respuestasArray = respuestaGuardada.respuesta.split(',').map((r: string) => r.trim());
                }

                const selecciones = control.get('selecciones') as FormArray;

                console.log('Restaurando opciones múltiples:', respuestasArray);

                // Marcar las opciones seleccionadas
                respuestasArray.forEach((respuesta: string) => {
                  const opcionIndex = pregunta.opciones?.indexOf(respuesta);
                  console.log(`  Buscando "${respuesta}" en opciones:`, opcionIndex);
                  if (opcionIndex !== undefined && opcionIndex !== -1 && selecciones.at(opcionIndex)) {
                    selecciones.at(opcionIndex).setValue(true);
                    console.log(` Marcada opción ${opcionIndex}`);
                  }
                });
              } catch (e) {
                console.warn('Error al parsear respuestas múltiples:', e);
              }
            } else {
              // Para otros tipos, solo establecer el valor
              console.log(`Restaurando respuesta tipo ${pregunta?.tipo}:`, respuestaGuardada.respuesta);
              control.get('respuesta')?.setValue(respuestaGuardada.respuesta);
            }
          }
        });

        // Actualizar progreso
        this.actualizarProgreso();

        console.log(`Progreso restaurado: ${progresoData.respuestas.length} respuestas cargadas, pregunta actual: ${this.preguntaActual + 1}`);

        // Mostrar mensaje de progreso restaurado
        this.messageService.add({
          severity: 'info',
          summary: 'Progreso restaurado',
          detail: `Continua respondiendo`
        });
      }
    } catch (error) {
      console.error('Error al cargar progreso guardado:', error);
    }
  }

  getPorcentajeProgreso(): number {
    return this.progreso;
  }

  /**
   * Calcula el tiempo transcurrido en segundos desde el inicio de esta sesión
   */
  private calcularTiempoTranscurrido(): number {
    if (!this.tiempoInicioSesion) {
      return 0;
    }
    const ahora = new Date();
    const diferenciaMs = ahora.getTime() - this.tiempoInicioSesion.getTime();
    return Math.floor(diferenciaMs / 1000); // convertir a segundos
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

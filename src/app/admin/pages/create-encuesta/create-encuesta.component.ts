import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { EncuestaService, Pregunta, Encuesta } from '../../../core/services/encuesta/encuesta.service';
import { MessageService } from 'primeng/api';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';

@Component({
  selector: 'app-create-encuesta',
  templateUrl: './create-encuesta.component.html',
  styleUrls: ['./create-encuesta.component.css']
})
export class CreateEncuestaComponent implements OnInit {
  encuestaForm!: FormGroup;
  loading = false;
  editMode = false;
  encuestaId?: number;

  questionTypes = [
    { label: 'Texto Corto', value: 'TEXTO_CORTO' },
    { label: 'Texto Largo', value: 'TEXTO_LARGO' },
    { label: 'Opción Única', value: 'OPCION_UNICA' },
    { label: 'Opción Múltiple', value: 'OPCION_MULTIPLE' },
    { label: 'Escala', value: 'ESCALA' },
    { label: 'Fecha', value: 'FECHA' },
    { label: 'Número', value: 'NUMERO' }
  ];

  estados = [
    { label: 'Borrador', value: 'BORRADOR' },
    { label: 'Activa', value: 'ACTIVA' },
    { label: 'Pausada', value: 'PAUSADA' },
    { label: 'Cerrada', value: 'CERRADA' }
  ];

  constructor(
    private fb: FormBuilder,
    private encuestaService: EncuestaService,
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Verificar que el usuario esté autenticado
    if (!this.authService.usuario || !this.authService.usuario.rol) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Debes iniciar sesión para crear encuestas'
      });
      this.router.navigate(['/auth/login']);
      return;
    }

    // Verificar si estamos en modo edición
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editMode = true;
      this.encuestaId = parseInt(id, 10);
    }

    this.initForm();

    // Si estamos en modo edición, cargar la encuesta
    if (this.editMode && this.encuestaId) {
      this.cargarEncuesta(this.encuestaId);
    }
  }

  initForm(): void {
    this.encuestaForm = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
      descripcion: [''],
      estado: ['BORRADOR', Validators.required],
      fecha_inicio: [null],
      fecha_fin: [null],
      tiempo_estimado: [10, [Validators.required, Validators.min(1), Validators.max(120)]],
      max_respuestas: [null],
      es_anonima: [false],
      permite_multiple_respuesta: [false],
      preguntas: this.fb.array([], [Validators.required, Validators.minLength(1)])
    });

    // Agregar primera pregunta por defecto
    this.addQuestion();
  }

  get questions(): FormArray {
    return this.encuestaForm.get('preguntas') as FormArray;
  }

  addQuestion(): void {
    const questionGroup = this.fb.group({
      texto: ['', [Validators.required, Validators.minLength(3)]],
      tipo: ['TEXTO_CORTO', Validators.required],
      es_requerida: [true],
      opciones: this.fb.array([]),
      configuracion: this.fb.group({
        min_value: [null],
        max_value: [null],
        step: [1]
      })
    });

    this.questions.push(questionGroup);
    this.updateOpcionesForQuestion(this.questions.length - 1);
  }

  removeQuestion(index: number): void {
    if (this.questions.length > 1) {
      this.questions.removeAt(index);
    }
  }

  updateOpcionesForQuestion(questionIndex: number): void {
    const question = this.questions.at(questionIndex);
    const tipo = question.get('tipo')?.value;
    const opciones = question.get('opciones') as FormArray;

    // Limpiar opciones existentes
    opciones.clear();

    if (tipo === 'OPCION_UNICA' || tipo === 'OPCION_MULTIPLE') {
      // Agregar opciones por defecto
      opciones.push(this.createOption());
      opciones.push(this.createOption());
    } else if (tipo === 'ESCALA') {
      // Configurar escala por defecto
      question.get('configuracion')?.patchValue({
        min_value: 1,
        max_value: 5,
        step: 1
      });
    }
  }

  createOption(): FormGroup {
    return this.fb.group({
      value: ['', Validators.required]
    });
  }

  addOption(questionIndex: number): void {
    const options = this.questions.at(questionIndex).get('opciones') as FormArray;
    if (options.length < 10) {
      options.push(this.createOption());
    }
  }

  removeOption(questionIndex: number, optionIndex: number): void {
    const options = this.questions.at(questionIndex).get('opciones') as FormArray;
    if (options.length > 1) {
      options.removeAt(optionIndex);
    }
  }

  getOptions(questionIndex: number): FormArray {
    return this.questions.at(questionIndex).get('opciones') as FormArray;
  }

  onQuestionTypeChange(questionIndex: number): void {
    this.updateOpcionesForQuestion(questionIndex);
  }

  canShowOpciones(tipo: string): boolean {
    return tipo === 'OPCION_UNICA' || tipo === 'OPCION_MULTIPLE';
  }

  canShowEscala(tipo: string): boolean {
    return tipo === 'ESCALA';
  }

  canShowFecha(tipo: string): boolean {
    return tipo === 'FECHA';
  }

  canShowNumero(tipo: string): boolean {
    return tipo === 'NUMERO';
  }

  isValidField(group: AbstractControl, field: string): boolean | null {
    const control = group.get(field);
    if (!control) return null;
    return !!control.errors && control.touched;
  }

  getFieldError(group: AbstractControl, field: string): string | null {
    const control = group.get(field);
    if (!control || !control.errors) return null;

    const errors = control.errors;
    for (const key of Object.keys(errors)) {
      switch (key) {
        case 'required':
          return 'Este campo es requerido';
        case 'minlength':
          return `Mínimo ${errors['minlength'].requiredLength} caracteres.`;
        case 'maxlength':
          return `Máximo ${errors['maxlength'].requiredLength} caracteres.`;
        case 'min':
          return `Valor mínimo: ${errors['min'].min}`;
        case 'max':
          return `Valor máximo: ${errors['max'].max}`;
      }
    }
    return null;
  }

  uniqueOptionsValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const options = control.value;
      if (!Array.isArray(options)) return null;

      const nonEmptyOptions = options.filter((option: { value: string }) => option.value?.trim() !== '');
      const values = nonEmptyOptions.map((option: { value: string }) => option.value?.trim().toLowerCase());
      const duplicatesIndices = values
        .map((value, index) => (values.indexOf(value) !== index ? index : -1))
        .filter((index) => index !== -1);

      if (duplicatesIndices.length > 0) {
        return { duplicateOptions: duplicatesIndices };
      }

      return null;
    };
  }

  hasDuplicateOptions(questionIndex: number, optionIndex: number): boolean {
    const options = this.getOptions(questionIndex);
    const newOptionValue = options.at(optionIndex).get('value')?.value.trim().toLowerCase();

    const duplicates = options.controls
      .filter((option, index) => index !== optionIndex && option.get('value')?.value.trim().toLowerCase() === newOptionValue);

    const optionControl = options.at(optionIndex);
    const touched = optionControl.touched || optionControl.dirty;

    return touched && duplicates.length > 0;
  }

  isDuplicateOption(option: AbstractControl, i: number, j: number): boolean {
    if (!option.get('value')?.value.trim()) {
      return false;
    }

    if (!option.get('value')?.touched) {
      return false;
    }

    const duplicateOptions = this.questions.at(i).get('opciones')?.errors?.['duplicateOptions'];
    return duplicateOptions ? duplicateOptions.includes(j) : false;
  }

  saveSurvey(): void {
    if (this.encuestaForm.valid) {
      this.loading = true;

      const formValue = this.encuestaForm.value;

      // Preparar datos para enviar
      const encuesta: Encuesta = {
        titulo: formValue.titulo.trim(),
        descripcion: formValue.descripcion?.trim() || null,
        estado: formValue.estado,
        fecha_inicio: formValue.fecha_inicio || null,
        fecha_fin: formValue.fecha_fin || null,
        tiempo_estimado: formValue.tiempo_estimado,
        max_respuestas: formValue.max_respuestas || null,
        es_anonima: formValue.es_anonima,
        permite_multiple_respuesta: formValue.permite_multiple_respuesta,
        preguntas: formValue.preguntas.map((pregunta: any, index: number) => {
          // Obtener las opciones del FormArray
          const opcionesFormArray = this.questions.at(index).get('opciones') as FormArray;
          const opcionesValidas = opcionesFormArray.value
            .filter((opcion: any) => opcion && opcion.value && typeof opcion.value === 'string' && opcion.value.trim())
            .map((opcion: any) => opcion.value.trim());
          const opciones = opcionesValidas.length > 0 ? opcionesValidas : null;

          return {
            texto: pregunta.texto.trim(),
            tipo: pregunta.tipo,
            es_requerida: pregunta.es_requerida,
            orden: index + 1,
            opciones: opciones,
            configuracion: pregunta.configuracion
          };
        })
      };

      if (this.editMode && this.encuestaId) {
        // Actualizar encuesta existente
        // console.log('Actualizando encuesta ID:', this.encuestaId);
        // console.log('Datos a enviar:', encuesta);
        this.encuestaService.actualizarEncuesta(this.encuestaId, encuesta).subscribe({
          next: (response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Encuesta actualizada correctamente'
            });
            this.router.navigate(['/admin/view-encuesta']);
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.error?.msj || 'Error al actualizar la encuesta'
            });
            this.loading = false;
          }
        });
      } else {
        // Crear nueva encuesta
        this.encuestaService.crearEncuesta(encuesta).subscribe({
          next: (response) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Encuesta creada correctamente'
            });
            this.router.navigate(['/admin/view-encuesta']);
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: error.error?.msj || 'Error al crear la encuesta'
            });
            this.loading = false;
          }
        });
      }
    } else {
      this.encuestaForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Por favor, completa todos los campos requeridos'
      });
    }
  }

  cargarEncuesta(id: number): void {
    this.loading = true;
    this.encuestaService.obtenerEncuestaPorId(id).subscribe({
      next: (response) => {
        if (response.ok) {
          const encuesta = response.data;
          // console.log('Encuesta cargada:', encuesta);

          // Limpiar preguntas existentes
          this.questions.clear();

          // Llenar el formulario con los datos de la encuesta
          this.encuestaForm.patchValue({
            titulo: encuesta.titulo,
            descripcion: encuesta.descripcion,
            estado: encuesta.estado,
            fecha_inicio: encuesta.fecha_inicio ? new Date(encuesta.fecha_inicio) : null,
            fecha_fin: encuesta.fecha_fin ? new Date(encuesta.fecha_fin) : null,
            tiempo_estimado: encuesta.tiempo_estimado,
            max_respuestas: encuesta.max_respuestas,
            es_anonima: encuesta.es_anonima,
            permite_multiple_respuesta: encuesta.permite_multiple_respuesta
          });

          // Agregar las preguntas
          if (encuesta.preguntas && encuesta.preguntas.length > 0) {
            encuesta.preguntas.forEach((pregunta: any) => {
              // Parsear la configuración si es string JSON
              let configuracionParsed = null;
              if (pregunta.configuracion) {
                try {
                  configuracionParsed = typeof pregunta.configuracion === 'string'
                    ? JSON.parse(pregunta.configuracion)
                    : pregunta.configuracion;
                } catch (e) {
                  console.warn('Error al parsear configuración:', e);
                  configuracionParsed = {};
                }
              }

              // Crear el FormGroup usando la misma estructura que addQuestion()
              const preguntaGroup = this.fb.group({
                texto: [pregunta.texto, [Validators.required, Validators.minLength(3)]],
                tipo: [pregunta.tipo, Validators.required],
                es_requerida: [pregunta.es_requerida],
                opciones: this.fb.array([]),
                configuracion: this.fb.group({
                  min_value: [configuracionParsed?.min || configuracionParsed?.min_value || null],
                  max_value: [configuracionParsed?.max || configuracionParsed?.max_value || null],
                  step: [configuracionParsed?.step || 1]
                })
              });

              this.questions.push(preguntaGroup);

              // Llenar las opciones si existen (pueden venir como string o array)
              let opcionesArray = preguntaGroup.get('opciones') as FormArray;
              if (pregunta.opciones) {
                let opciones: string[] = [];

                if (typeof pregunta.opciones === 'string') {
                  try {
                    opciones = JSON.parse(pregunta.opciones);
                  } catch (e) {
                    // Si no es JSON válido, tratarlo como array separado por comas
                    opciones = pregunta.opciones.split(',').map((o: string) => o.trim()).filter((o: string) => o);
                  }
                } else if (Array.isArray(pregunta.opciones)) {
                  opciones = pregunta.opciones;
                }

                opciones.forEach((opcion: string) => {
                  if (opcion && opcion.trim()) {
                    opcionesArray.push(this.fb.group({
                      value: [opcion.trim(), Validators.required]
                    }));
                  }
                });
              }

              // No actualizar las opciones porque ya las llenamos desde la BD
              // this.updateOpcionesForQuestion(this.questions.length - 1);
            });
          } else {
            // Si no hay preguntas, agregar una por defecto
            this.addQuestion();
          }

          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Encuesta cargada para edición'
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: response.msj || 'Error al cargar la encuesta'
          });
          this.router.navigate(['/admin/view-encuesta']);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar encuesta:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error del servidor al cargar la encuesta'
        });
        this.router.navigate(['/admin/view-encuesta']);
        this.loading = false;
      }
    });
  }

  resetForm(): void {
    this.encuestaForm.reset();
    this.questions.clear();
    this.addQuestion();
    this.editMode = false;
    this.encuestaId = undefined;
  }

  cancel(): void {
    this.router.navigate(['/admin/view-encuesta']);
  }

  moveUp(index: number): void {
    if (index > 0) {
      const currentQuestion = this.questions.at(index);
      const previousQuestion = this.questions.at(index - 1);

      this.questions.setControl(index, previousQuestion);
      this.questions.setControl(index - 1, currentQuestion);
    }
  }

  moveDown(index: number): void {
    if (index < this.questions.length - 1) {
      const currentQuestion = this.questions.at(index);
      const nextQuestion = this.questions.at(index + 1);

      this.questions.setControl(index, nextQuestion);
      this.questions.setControl(index + 1, currentQuestion);
    }
  }
}

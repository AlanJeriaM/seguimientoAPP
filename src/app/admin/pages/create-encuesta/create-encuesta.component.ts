import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

@Component({
  selector: 'app-create-encuesta',
  templateUrl: './create-encuesta.component.html',
  styleUrls: ['./create-encuesta.component.css']
})
export class CreateEncuestaComponent implements OnInit {
  encuestaForm!: FormGroup;

  questionTypes = [{ label: 'Selección Múltiple', value: 'multiple' }];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.encuestaForm = this.fb.group({
      tituloEncuesta: ['', [Validators.required, Validators.minLength(3)]],
      questions: this.fb.array([])
    });
  }

  get questions(): FormArray {
    return this.encuestaForm.get('questions') as FormArray;
  }

  addQuestion(): void {
    const questionGroup = this.fb.group({
      tituloPregunta: ['', [Validators.required, Validators.minLength(3)]],
      type: ['multiple', Validators.required],
      options: this.fb.array(
        [this.createOption(), this.createOption()],
        this.uniqueOptionsValidator() // Aplicar el validador aquí
      )
    });
    this.questions.push(questionGroup);


  }

  removeQuestion(index: number): void {
    this.questions.removeAt(index);
  }

  createOption(): FormGroup {
    return this.fb.group({
      value: ['', Validators.required],

    });
  }

  addOption(questionIndex: number): void {
    const options = this.questions.at(questionIndex).get('options') as FormArray;
    if (options.length < 5) {
      options.push(this.createOption());
    }
  }

  removeOption(questionIndex: number, optionIndex: number): void {
    const options = this.questions.at(questionIndex).get('options') as FormArray;
    options.removeAt(optionIndex);
  }


  saveSurvey(): void {
    if (this.encuestaForm.valid) {
      console.log('Encuesta guardada:', this.encuestaForm.value);
      this.resetForm();
    } else {
      this.encuestaForm.markAllAsTouched();
    }
  }



  resetForm(): void {
    this.encuestaForm.reset();
    this.questions.clear();
  }

  // Ayuda para acceder a las opciones de cada pregunta
  getOptions(questionIndex: number): FormArray {
    return this.questions.at(questionIndex).get('options') as FormArray;
  }

 isValidField(group: AbstractControl, field: string): boolean | null {
  const control = group.get(field);
  if (!control) return null; // Si el control no existe, devuelve null
  return !!control.errors && control.touched; // Asegura que el resultado sea boolean
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
    }
  }
  return null;
}

uniqueOptionsValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const options = control.value; // Obtener los valores del FormArray
    if (!Array.isArray(options)) return null;

    const nonEmptyOptions = options.filter((option: { value: string }) => option.value?.trim() !== '');
    const values = nonEmptyOptions.map((option: { value: string }) => option.value?.trim().toLowerCase());
    const duplicatesIndices = values
      .map((value, index) => (values.indexOf(value) !== index ? index : -1))
      .filter((index) => index !== -1);

    if (duplicatesIndices.length > 0) {
      return { duplicateOptions: duplicatesIndices }; // Devuelve los índices duplicados
    }

    return null; // No hay duplicados
  };
}


hasDuplicateOptions(questionIndex: number, optionIndex: number): boolean {
  const options = this.getOptions(questionIndex);
  const newOptionValue = options.at(optionIndex).get('value')?.value.trim().toLowerCase(); // Obtener el valor de la opción recién creada

  // Comprobar si alguna opción tiene el mismo valor que la opción recién creada
  const duplicates = options.controls
    .filter((option, index) => index !== optionIndex && option.get('value')?.value.trim().toLowerCase() === newOptionValue);

  // Verificar si la opción fue tocada (para evitar que valide de inmediato)
  const optionControl = options.at(optionIndex);
  const touched = optionControl.touched || optionControl.dirty;

  // Mostrar error solo si hay duplicados y el campo ha sido tocado
  return touched && duplicates.length > 0;
}

isDuplicateOption(option: AbstractControl, i: number, j: number): boolean {
  // Verifica si el valor del campo no está vacío
  if (!option.get('value')?.value.trim()) {
    return false;
  }

  // Verifica si el campo fue tocado
  if (!option.get('value')?.touched) {
    return false;
  }

  // Verifica si existen errores de opciones duplicadas
  const duplicateOptions = this.questions.at(i).get('options')?.errors?.['duplicateOptions'];
  return duplicateOptions ? duplicateOptions.includes(j) : false;
}

}

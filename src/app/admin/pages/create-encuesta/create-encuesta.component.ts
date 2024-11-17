import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';

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
      options: this.fb.array([this.createOption(), this.createOption()] ,)
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


  // Validador para asegurarse de que haya al menos 2 opciones
  // minOptionsValidator(control: FormArray): { [key: string]: boolean } | null {
  //   return control.length >= 2 ? null : { 'minOptions': true };
  // }

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

  public isValidField( form: FormGroup ,field : string): boolean | null{
    return form.controls[field].errors && form.controls[field].touched;
  }

  getFieldError( field: string ): string | null{
    if ( !this.encuestaForm.controls[field] ) return null;
    const errors = this.encuestaForm.controls[field].errors || {};
    for (const key of Object.keys(errors)){
      switch(key){
        case 'required':
          return 'Este campo es requerido';

        case 'minlength':
          return `Mínimo ${ errors ['minlength'].requiredLength } caracteres.`
      }
    }
    return null;

  }
}

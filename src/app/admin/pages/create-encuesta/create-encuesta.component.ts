import { Component } from '@angular/core';

interface Question {
  text: string;
  type: string;
  options: string[];
}

@Component({
  selector: 'app-create-encuesta',
  templateUrl: './create-encuesta.component.html',
  styleUrls: ['./create-encuesta.component.css']
})
export class CreateEncuestaComponent {
  surveyTitle: string = '';
  questions: Question[] = [];
  questionTypes = [{ label: 'Selección Múltiple', value: 'multiple' }];

  // Propiedades de mensaje de error
  errorMessages: string[] = [];
  formIsValid: boolean = false;  // Nuevo estado para controlar si el formulario es válido

  addQuestion() {
    this.questions.push({
      text: '',
      type: 'multiple',
      options: ['', '']  // Por defecto, crea 2 opciones vacías para validación.
    });
    this.validateSurvey();
  }

  removeQuestion(index: number) {
    this.questions.splice(index, 1);
    this.validateSurvey();  // Validar nuevamente después de eliminar la pregunta
  }

  addOption(questionIndex: number) {
    this.questions[questionIndex].options.push('');
    this.validateSurvey();  // Validar nuevamente después de agregar una opción
  }

  removeOption(questionIndex: number, optionIndex: number) {
    this.questions[questionIndex].options.splice(optionIndex, 1);
    this.validateSurvey();  // Validar nuevamente después de eliminar una opción
  }

  saveSurvey() {
    if (!this.validateSurvey()) return;

    const survey = {
      title: this.surveyTitle,
      questions: this.questions
    };

    console.log('Encuesta guardada:', survey);
    this.resetForm();
  }

  resetForm() {
    this.surveyTitle = '';
    this.questions = [];
    this.errorMessages = [];  // Limpia los mensajes de error al restablecer el formulario
    this.formIsValid = false; // Resetea el estado de validación
  }

  validateSurvey(): boolean {
    this.errorMessages = [];  // Reinicia los mensajes de error

    if (!this.surveyTitle.trim()) {
      this.errorMessages.push('El título de la encuesta no puede estar vacío.');
    }

    if (this.questions.length === 0) {
      this.errorMessages.push('Debe agregar al menos una pregunta.');
    }

    this.questions.forEach((question, index) => {
      if (!question.text.trim()) {
        this.errorMessages.push(`La pregunta ${index + 1} no tiene título.`);
      }
      if (question.type === 'multiple') {
        if (question.options.length < 2) {
          this.errorMessages.push(`La pregunta ${index + 1} debe tener al menos 2 opciones.`);
        } else if (!question.options.every(option => option.trim() !== '')) {
          this.errorMessages.push(`Todas las opciones de la pregunta ${index + 1} deben estar completas.`);
        }
      }
    });

    this.formIsValid = this.errorMessages.length === 0;  // Actualiza el estado de validez

    return this.formIsValid;  // Retorna si el formulario es válido
  }

  // trackBy para optimizar el rendimiento del ngFor
  trackByIndex(index: number, obj: any): any {
    return index;
  }
}

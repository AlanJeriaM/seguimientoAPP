import { Component } from '@angular/core';

interface Question {
  text: string;
  type: string;
  options: string[];
}


@Component({
  selector: 'app-create-encuesta',
  templateUrl: './create-encuesta.component.html',
  styleUrl: './create-encuesta.component.css'
})
export class CreateEncuestaComponent {

  surveyTitle: string = '';
  questions: Question[] = [];
  questionTypes = [
    { label: 'Selección Múltiple', value: 'multiple' },
    { label: 'Texto Libre', value: 'text' }
  ];

  // Método para agregar una nueva pregunta
  addQuestion() {
    this.questions.push({
      text: '',
      type: '',
      options: []
    });
  }

  // Método para eliminar una pregunta específica
  removeQuestion(index: number) {
    this.questions.splice(index, 1);
  }

  // Método para agregar una opción a una pregunta de selección múltiple
  addOption(questionIndex: number) {
    this.questions[questionIndex].options.push('');
  }

  // Método para eliminar una opción específica de una pregunta
  removeOption(questionIndex: number, optionIndex: number) {
    this.questions[questionIndex].options.splice(optionIndex, 1);
  }

  // Método para guardar la encuesta
  saveSurvey() {
    if (!this.surveyTitle || this.questions.length === 0) {
      alert('El título de la encuesta y al menos una pregunta son requeridos.');
      return;
    }

    const survey = {
      title: this.surveyTitle,
      questions: this.questions
    };

    console.log('Encuesta guardada:', survey);
    // Aquí puedes llamar al servicio para enviar la encuesta al backend
    // Por ejemplo: this.surveyService.createSurvey(survey).subscribe(...)

    // Limpieza del formulario
    this.resetForm();
  }

  // Método para limpiar el formulario después de guardar la encuesta
  resetForm() {
    this.surveyTitle = '';
    this.questions = [];
  }



}

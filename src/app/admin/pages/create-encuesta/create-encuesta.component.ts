
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
  questionTypes = [
    { label: 'Selección Múltiple', value: 'multiple' }
  ];

  addQuestion() {
    this.questions.push({
      text: '',
      type: 'multiple',
      options: ['', '']  // Por defecto, crea 2 opciones vacías para validación.
    });
  }

  removeQuestion(index: number) {
    this.questions.splice(index, 1);
  }

  addOption(questionIndex: number) {
    this.questions[questionIndex].options.push('');
  }

  removeOption(questionIndex: number, optionIndex: number) {
    this.questions[questionIndex].options.splice(optionIndex, 1);
  }

  saveSurvey() {
    if (!this.validateSurvey()) {
      alert('Por favor, asegúrese de que el título, al menos una pregunta, y mínimo 2 opciones estén completas, sin campos vacíos.');
      return;
    }

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
  }

  validateSurvey(): boolean {
    if (!this.surveyTitle.trim()) return false;
    if (this.questions.length === 0) return false;

    return this.questions.every(question => {
      if (!question.text.trim()) return false;
      if (question.type === 'multiple' && question.options.length < 2) return false;
      return question.options.every(option => option.trim() !== '');
    });
  }

  // trackBy para optimizar el rendimiento del ngFor
  trackByIndex(index: number, obj: any): any {
    return index;
  }
}

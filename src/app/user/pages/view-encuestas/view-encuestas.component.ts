import { Component, Input } from '@angular/core';

interface Question {
  text: string;
  type: string;
  options: string[];
}

@Component({
  selector: 'app-view-encuestas-user',
  templateUrl: './view-encuestas.component.html',
  styleUrl: './view-encuestas.component.css'
})
export class ViewEncuestasComponent {

  @Input() surveyTitle: string = ''; // Recibir el título de la encuesta
  @Input() questions: Question[] = []; // Recibir las preguntas como entrada

  // Respuestas del usuario
  userResponses: any[] = [];

  constructor() {}

  submitResponses() {
    console.log('Respuestas del usuario:', this.userResponses);
    // Aquí puedes manejar el envío de respuestas a un backend o servicio
  }

}

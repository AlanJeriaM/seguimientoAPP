import { Component } from '@angular/core';
import { EstandardDticService } from '../../../core/services/dtic/estandard-dtic.service';

@Component({
  selector: 'app-view-encuestas',
  templateUrl: './view-encuestas.component.html',
  styleUrl: './view-encuestas.component.css'
})
export class ViewEncuestasComponent {

  constructor(private estandardDticService: EstandardDticService) {}

  registros: any[] = [];

  ngOnInit() {
    this.registros = this.estandardDticService.getRegistros();
  }

  comboRandomA = [
    { label: 'randomA_0', value: 'randomA_0' },
    { label: 'randomA_1', value: 'randomA_1' },
  ];
  comboRandomB = [
    { label: 'randomB_0', value: 'randomB_0' },
    { label: 'randomB_1', value: 'randomB_1' },
    { label: 'randomB_2', value: 'randomB_2' },
    { label: 'randomB_3', value: 'randomB_3' },
    { label: 'randomB_4', value: 'randomB_4' },
  ];

}

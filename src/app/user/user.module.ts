import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';


import { MainComponent } from './pages/main/main.component';
import { MiProfileComponent } from './pages/mi-profile/mi-profile.component';
import { ViewEncuestasComponent } from './pages/view-encuestas/view-encuestas.component';
import { UserRoutingModule } from './user-routing.module';
import { PrimeNgModule } from '../modules/prime-ng.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { EncuestaCompletadaComponent } from './pages/encuesta-completada/encuesta-completada.component';
import { SharedModule } from '../shared/shared.module';
import { ResponderEncuestaComponent } from './pages/responder-encuesta/responder-encuesta.component';
import { ConfirmSubmitModalComponent } from './components/confirm-submit-modal/confirm-submit-modal.component';
import { SaveProgressModalComponent } from './components/save-progress-modal/save-progress-modal.component';



@NgModule({
  declarations: [
    MainComponent,
    MiProfileComponent,
    ViewEncuestasComponent,
    EncuestaCompletadaComponent,
    ResponderEncuestaComponent,
    ConfirmSubmitModalComponent,
    SaveProgressModalComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    UserRoutingModule,
    PrimeNgModule,
    ReactiveFormsModule,
    FormsModule,
    NgbModule,
  ],
  providers: [
    MessageService,
    ConfirmationService,
  ]
})
export class UserModule { }

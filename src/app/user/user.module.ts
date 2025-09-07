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



@NgModule({
  declarations: [
    MainComponent,
    MiProfileComponent,
    ViewEncuestasComponent,
    EncuestaCompletadaComponent,
    ResponderEncuestaComponent
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

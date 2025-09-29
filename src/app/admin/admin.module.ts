import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MainComponent } from './pages/main/main.component';

import { CreateEncuestaComponent } from './pages/create-encuesta/create-encuesta.component';
import { ViewDeletedUsersComponent } from './pages/view-deleted-users/view-deleted-users.component';
import { ViewUsersComponent } from './pages/view-users/view-users.component';
import { AdminRoutingModule } from './admin-routing.module';
import { PrimeNgModule } from '../modules/prime-ng.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ViewEncuestasComponent } from './pages/view-encuestas/view-encuestas.component';
import { SharedModule } from '../shared/shared.module';
import { MiProfileComponent } from './pages/mi-profile/mi-profile.component';
import { ViewAdminComponent } from './pages/view-admin/view-admin.component';
import { ViewDeletedAdminComponent } from './pages/view-deleted-admin/view-deleted-admin.component';
import { ViewEncuestasResultadosComponent } from './pages/view-encuestas-resultados/view-encuestas-resultados.component';
import { EditUserProfileComponent } from './pages/edit-user-profile/edit-user-profile.component';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';


@NgModule({
  declarations: [
    MainComponent,
    CreateEncuestaComponent,
    ViewDeletedUsersComponent,
    ViewUsersComponent,
    ViewEncuestasComponent,
    MiProfileComponent,
    ViewAdminComponent,
    ViewDeletedAdminComponent,
    ViewEncuestasResultadosComponent,
    EditUserProfileComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    AdminRoutingModule,
    PrimeNgModule,
    FormsModule,
    ReactiveFormsModule,
    ToastModule,
  ],
  providers: [MessageService, ConfirmationService]
})
export class AdminModule { }

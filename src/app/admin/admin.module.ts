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
  ],
  imports: [
    CommonModule,
    SharedModule,
    AdminRoutingModule,
    PrimeNgModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class AdminModule { }

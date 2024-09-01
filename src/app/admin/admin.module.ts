import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MainComponent } from './pages/main/main.component';

import { CreateEncuestaComponent } from './pages/create-encuesta/create-encuesta.component';
import { ViewDeletedUsersComponent } from './pages/view-deleted-users/view-deleted-users.component';
import { ViewUsersComponent } from './pages/view-users/view-users.component';
import { DashboardAdminComponent } from './pages/dashboard-admin/dashboard-admin.component';
import { AdminRoutingModule } from './admin-routing.module';
import { PrimeNgModule } from '../modules/prime-ng.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ViewEncuestasComponent } from './pages/view-encuestas/view-encuestas.component';
import { SharedModule } from '../shared/shared.module';



@NgModule({
  declarations: [

    MainComponent,
    CreateEncuestaComponent,
    ViewDeletedUsersComponent,
    ViewUsersComponent,
    DashboardAdminComponent,
    ViewEncuestasComponent,
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

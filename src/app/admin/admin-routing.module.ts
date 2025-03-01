import { Component, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './pages/main/main.component';
import { ViewUsersComponent } from './pages/view-users/view-users.component';
import { ViewDeletedUsersComponent } from './pages/view-deleted-users/view-deleted-users.component';
import { CreateEncuestaComponent } from './pages/create-encuesta/create-encuesta.component';
import { ViewEncuestasComponent } from './pages/view-encuestas/view-encuestas.component';
import { MiProfileComponent } from './pages/mi-profile/mi-profile.component';
import { SharedDashboardComponent } from '../shared/pages/shared-dashboard/shared-dashboard.component';

const routes: Routes = [
  {
      path: '',
      component: MainComponent,
      children: [
        { path: 'view-users', component: ViewUsersComponent },
        { path: 'mi-perfil', component: MiProfileComponent},
        { path: 'view-deleted-users', component: ViewDeletedUsersComponent },
        { path: 'create-encuesta', component: CreateEncuestaComponent},
        { path: 'view-encuesta', component: ViewEncuestasComponent},
        { path: 'dashboard', component: SharedDashboardComponent},
        { path: '**', redirectTo: 'dashboard' }
      ],
    }

    ]

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})

export class AdminRoutingModule { }

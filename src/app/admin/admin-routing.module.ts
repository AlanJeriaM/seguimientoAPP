import { Component, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './pages/main/main.component';
import { ViewUsersComponent } from './pages/view-users/view-users.component';
import { HomeComponent } from './pages/home/home.component';
import { ViewDeletedUsersComponent } from './pages/view-deleted-users/view-deleted-users.component';
import { CreateEncuestaComponent } from './pages/create-encuesta/create-encuesta.component';
import { DashboardAdminComponent } from './pages/dashboard-admin/dashboard-admin.component';
import { ViewEncuestasComponent } from './pages/view-encuestas/view-encuestas.component';

const routes: Routes = [
  {
      path: '',
      component: MainComponent,
      children: [
        //{ path: 'home', component: HomeComponent },
        { path: 'view-users', component: ViewUsersComponent },
        { path: 'view-deleted-users', component: ViewDeletedUsersComponent },
        { path: 'create-encuesta', component: CreateEncuestaComponent},
        { path: 'view-encuesta', component: ViewEncuestasComponent},
        { path: 'dashboard', component: DashboardAdminComponent},
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

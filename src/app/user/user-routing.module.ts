import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './pages/main/main.component';
import { MiProfileComponent } from './pages/mi-profile/mi-profile.component';
import { ViewEncuestasComponent } from './pages/view-encuestas/view-encuestas.component';
import { EncuestaCompletadaComponent } from './pages/encuesta-completada/encuesta-completada.component';
import { ResponderEncuestaComponent } from './pages/responder-encuesta/responder-encuesta.component';
import { SharedDashboardComponent } from '../shared/pages/shared-dashboard/shared-dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      { path: 'mi-perfil', component: MiProfileComponent },
      { path: 'dashboard', component: SharedDashboardComponent },
      { path: 'view-encuestas', component: ViewEncuestasComponent },
      { path: 'responder-encuesta/:id', component: ResponderEncuestaComponent },
      { path: 'encuesta-completada', component: EncuestaCompletadaComponent },
      { path: 'encuesta-completada/:id', component: EncuestaCompletadaComponent },
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

export class UserRoutingModule { }

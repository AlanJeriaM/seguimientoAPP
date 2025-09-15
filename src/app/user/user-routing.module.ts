import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './pages/main/main.component';
import { MiProfileComponent } from './pages/mi-profile/mi-profile.component';
import { ViewEncuestasComponent } from './pages/view-encuestas/view-encuestas.component';
import { EncuestaCompletadaComponent } from './pages/encuesta-completada/encuesta-completada.component';
import { ResponderEncuestaComponent } from './pages/responder-encuesta/responder-encuesta.component';
import { SharedDashboardComponent } from '../shared/pages/shared-dashboard/shared-dashboard.component';
import { ProfileCompletionGuard } from '../core/guards/profile-completion.guard';

const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      { path: 'mi-perfil', component: MiProfileComponent },
      { path: 'dashboard', component: SharedDashboardComponent, canActivate: [ProfileCompletionGuard] },
      { path: 'view-encuestas', component: ViewEncuestasComponent, canActivate: [ProfileCompletionGuard] },
      { path: 'responder-encuesta/:id', component: ResponderEncuestaComponent, canActivate: [ProfileCompletionGuard] },
      { path: 'encuesta-completada', component: EncuestaCompletadaComponent, canActivate: [ProfileCompletionGuard] },
      { path: 'encuesta-completada/:id', component: EncuestaCompletadaComponent, canActivate: [ProfileCompletionGuard] },
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

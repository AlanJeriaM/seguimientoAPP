import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './pages/main/main.component';
import { HomeComponent } from './pages/home/home.component';
import { MiProfileComponent } from './pages/mi-profile/mi-profile.component';
import { DashboardUserComponent } from './pages/dashboard-user/dashboard-user.component';
import { ViewEncuestasComponent } from './pages/view-encuestas/view-encuestas.component';
import { EncuestaCompletadaComponent } from './pages/encuesta-completada/encuesta-completada.component';

const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      //{ path: 'home', component: HomeComponent },
      { path: 'my-profile', component: MiProfileComponent },
      { path: 'dashboard', component: DashboardUserComponent },
      { path: 'view-encuestas', component: ViewEncuestasComponent },
      {path:  'encuesta-completada', component: EncuestaCompletadaComponent},
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

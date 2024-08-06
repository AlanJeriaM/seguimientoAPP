import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarUserComponent } from './components/navbar-user/navbar-user.component';
import { SidebarUserComponent } from './components/sidebar-user/sidebar-user.component';
import { HomeComponent } from './pages/home/home.component';
import { MainComponent } from './pages/main/main.component';
import { MiProfileComponent } from './pages/mi-profile/mi-profile.component';
import { DashboardUserComponent } from './pages/dashboard-user/dashboard-user.component';
import { ViewEncuestasComponent } from './pages/view-encuestas/view-encuestas.component';
import { UserRoutingModule } from './user-routing.module';
import { PrimeNgModule } from '../shared/modules/prime-ng/prime-ng.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { EncuestaCompletadaComponent } from './pages/encuesta-completada/encuesta-completada.component';
import { SharedModule } from '../shared/shared.module';



@NgModule({
  declarations: [
    NavbarUserComponent,
    SidebarUserComponent,
    HomeComponent,
    MainComponent,
    MiProfileComponent,
    DashboardUserComponent,
    ViewEncuestasComponent,
    EncuestaCompletadaComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    UserRoutingModule,
    PrimeNgModule,
    ReactiveFormsModule,
    NgbModule,
  ],
  providers: [
    MessageService,
  ]
})
export class UserModule { }

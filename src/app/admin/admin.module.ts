import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterComponent } from './components/footer/footer.component';
import { NavbarAdminComponent } from './components/navbar-admin/navbar-admin.component';
import { SidebarAdminComponent } from './components/sidebar-admin/sidebar-admin.component';
import { MainComponent } from './pages/main/main.component';
import { HomeComponent } from './pages/home/home.component';
import { CreateEncuestaComponent } from './pages/create-encuesta/create-encuesta.component';
import { ViewDeletedUsersComponent } from './pages/view-deleted-users/view-deleted-users.component';
import { ViewUsersComponent } from './pages/view-users/view-users.component';
import { DashboardAdminComponent } from './pages/dashboard-admin/dashboard-admin.component';
import { AdminRoutingModule } from './admin-routing.module';
import { PrimeNgModule } from '../shared/modules/prime-ng/prime-ng.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ViewEncuestasComponent } from './pages/view-encuestas/view-encuestas.component';



@NgModule({
  declarations: [
    FooterComponent,
    NavbarAdminComponent,
    SidebarAdminComponent,
    MainComponent,
    HomeComponent,
    CreateEncuestaComponent,
    ViewDeletedUsersComponent,
    ViewUsersComponent,
    DashboardAdminComponent,
    ViewEncuestasComponent,
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    PrimeNgModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
  ]
})
export class AdminModule { }

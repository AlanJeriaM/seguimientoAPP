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
    DashboardAdminComponent
  ],
  imports: [
    CommonModule
  ]
})
export class AdminModule { }

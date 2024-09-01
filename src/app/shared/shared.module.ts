import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '../modules/prime-ng.module';
import { FooterComponent } from './components/footer/footer.component';
import { Error404PageComponent } from './pages/error404-page/error404-page.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NavbarSharedComponent } from './components/navbar-shared/navbar-shared.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';






@NgModule({
  declarations: [
    FooterComponent,
    Error404PageComponent,
    NavbarSharedComponent,
    SidebarComponent,
  ],
  imports: [
    CommonModule,
    PrimeNgModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [
    FooterComponent,
    Error404PageComponent,
    NavbarSharedComponent,
  ],
})
export class SharedModule { }

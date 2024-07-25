import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';


import { FooterComponent } from './components/footer/footer.component';
import { NavbarVisitorComponent } from './components/navbar-visitor/navbar-visitor.component';
import { TermsAndConditionsComponent } from './components/terms-and-conditions/terms-and-conditions.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { MainComponent } from './pages/main/main.component';
import { RegisterComponent } from './pages/register/register.component';
import { VisitorRoutingModule } from './visitor-routing.module';
import { PrimeNgModule } from '../shared/modules/prime-ng/prime-ng.module';
import { NgbModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ReactiveFormsModule } from '@angular/forms';


const components: any[] = [

  HomeComponent,
  LoginComponent,
  FooterComponent,
  NavbarVisitorComponent,
  MainComponent,
  RegisterComponent,
  TermsAndConditionsComponent,

]


@NgModule({
  declarations: [
    ...components,

  ],
  imports: [
    CommonModule,
    VisitorRoutingModule,
    ReactiveFormsModule,
    PrimeNgModule,
    NgbModule,
    NgbPaginationModule,
  ],


})
export class VisitorModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterComponent } from './components/footer/footer.component';
import { NavbarVisitorComponent } from './components/navbar-visitor/navbar-visitor.component';
import { TermsAndConditionsComponent } from './components/terms-and-conditions/terms-and-conditions.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { MainComponent } from './pages/main/main.component';
import { RegisterComponent } from './pages/register/register.component';



@NgModule({
  declarations: [
    FooterComponent,
    NavbarVisitorComponent,
    TermsAndConditionsComponent,
    HomeComponent,
    LoginComponent,
    MainComponent,
    RegisterComponent
  ],
  imports: [
    CommonModule
  ]
})
export class VisitorModule { }

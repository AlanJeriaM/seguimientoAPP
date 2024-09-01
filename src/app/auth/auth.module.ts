import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { PrimeNgModule } from '../modules/prime-ng.module';
import { SharedModule } from '../shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';
import { MainComponent } from './pages/main/main.component';



@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent,
    MainComponent,
  ],
  imports: [
    CommonModule,
    AuthRoutingModule,
    PrimeNgModule,
    SharedModule,
    ReactiveFormsModule,
  ]
})
export class AuthModule { }

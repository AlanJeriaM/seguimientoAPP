import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { PrimeNgModule } from '../modules/prime-ng.module';
import { SharedModule } from '../shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';
import { MainComponent } from './pages/main/main.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent,
    MainComponent,
    ResetPasswordComponent,
  ],
  imports: [
    CommonModule,
    AuthRoutingModule,
    PrimeNgModule,
    SharedModule,
    ReactiveFormsModule,
    ToastModule,
  ],
  providers: [MessageService]
})
export class AuthModule { }

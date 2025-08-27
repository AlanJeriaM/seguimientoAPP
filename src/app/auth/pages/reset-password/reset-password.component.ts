import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  
  resetForm: FormGroup;
  codeForm: FormGroup;
  newPasswordForm: FormGroup;
  
  currentStep: 'email' | 'code' | 'password' = 'email';
  loading = false;
  emailSent = false;
  codeAttempts = 0;
  maxCodeAttempts = 3;
  countdown = 0;
  canResendCode = false;
  
  // Para mostrar/ocultar contraseñas
  showNewPassword = false;
  showConfirmPassword = false;

  // Propiedad computada para saber si puede verificar código
  get canVerifyCode(): boolean {
    return this.codeAttempts < this.maxCodeAttempts;
  }

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private messageService: MessageService
  ) {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
    
    this.codeForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });
    
    this.newPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {}

  // Validar que las contraseñas coincidan
  passwordMatchValidator(group: FormGroup) {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  // Paso 1: Enviar código de verificación
  async sendResetCode() {
    if (this.resetForm.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor, ingresa un correo válido'
      });
      return;
    }

    this.loading = true;
    const email = this.resetForm.get('email')?.value;

    try {
      const response = await this.authService.sendResetCode(email).toPromise();
      
      if (response.ok) {
        this.emailSent = true;
        this.currentStep = 'code';
        this.startCountdown();
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Código de verificación enviado a tu correo'
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: response.msj || 'Error al enviar el código'
        });
      }
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error de conexión. Intenta nuevamente'
      });
    } finally {
      this.loading = false;
    }
  }

  // Paso 2: Verificar código
  async verifyCode() {
    if (this.codeForm.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Por favor, ingresa el código de 6 dígitos'
      });
      return;
    }

    // Verificar que aún tenga intentos disponibles
    if (!this.canVerifyCode) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Has agotado todos los intentos. Solicita un nuevo código'
      });
      return;
    }

    this.loading = true;
    const email = this.resetForm.get('email')?.value;
    const code = this.codeForm.get('code')?.value;

    try {
      const response = await this.authService.verifyResetCode(email, code).toPromise();
      
      if (response.ok) {
        this.currentStep = 'password';
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Código verificado correctamente'
        });
      } else {
        this.codeAttempts++;
        this.codeForm.get('code')?.setValue('');
        
        if (this.codeAttempts >= this.maxCodeAttempts) {
          // Usuario agotó todos los intentos
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Has agotado todos los intentos. Solicita un nuevo código'
          });
          this.canResendCode = true;
          // Limpiar el formulario y deshabilitar la verificación
          this.codeForm.reset();
        } else {
          // Aún tiene intentos disponibles
          const intentosRestantes = this.maxCodeAttempts - this.codeAttempts;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Código incorrecto. Intentos restantes: ${intentosRestantes}`
          });
        }
      }
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error de conexión. Intenta nuevamente'
      });
    } finally {
      this.loading = false;
    }
  }

  // Paso 3: Cambiar contraseña
  async changePassword() {
    if (this.newPasswordForm.invalid) {
      if (this.newPasswordForm.hasError('passwordMismatch')) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Las contraseñas no coinciden'
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Por favor, completa todos los campos correctamente'
        });
      }
      return;
    }

    this.loading = true;
    const email = this.resetForm.get('email')?.value;
    const newPassword = this.newPasswordForm.get('newPassword')?.value;

    try {
      const response = await this.authService.resetPassword(email, newPassword).toPromise();
      
      if (response.ok) {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Contraseña cambiada correctamente'
        });
        
        // Resetear formularios y volver al paso 1
        setTimeout(() => {
          this.resetToInitialState();
        }, 2000);
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: response.msj || 'Error al cambiar la contraseña'
        });
      }
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error de conexión. Intenta nuevamente'
      });
    } finally {
      this.loading = false;
    }
  }

  // Reenviar código
  async resendCode() {
    this.loading = true;
    const email = this.resetForm.get('email')?.value;

    try {
      const response = await this.authService.sendResetCode(email).toPromise();
      
      if (response.ok) {
        // Resetear completamente el estado de intentos
        this.codeAttempts = 0;
        this.canResendCode = false;
        this.codeForm.reset();
        this.startCountdown();
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Nuevo código enviado a tu correo. Tienes 3 nuevos intentos.'
        });
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: response.msj || 'Error al reenviar el código'
        });
      }
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error de conexión. Intenta nuevamente'
      });
    } finally {
      this.loading = false;
    }
  }

  // Iniciar countdown para reenvío de código
  startCountdown() {
    this.countdown = 60; // 60 segundos
    this.canResendCode = false;
    
    const timer = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(timer);
        this.canResendCode = true;
      }
    }, 1000);
  }

  // Volver al paso anterior
  goBack() {
    if (this.currentStep === 'code') {
      this.currentStep = 'email';
      this.emailSent = false;
      this.codeAttempts = 0;
      this.canResendCode = false;
      this.countdown = 0;
      this.codeForm.reset();
    } else if (this.currentStep === 'password') {
      this.currentStep = 'code';
    }
  }

  // Resetear al estado inicial
  resetToInitialState() {
    this.currentStep = 'email';
    this.emailSent = false;
    this.codeAttempts = 0;
    this.canResendCode = false;
    this.countdown = 0;
    this.resetForm.reset();
    this.codeForm.reset();
    this.newPasswordForm.reset();
    this.showNewPassword = false;
    this.showConfirmPassword = false;
  }

  // Toggle para mostrar/ocultar contraseñas
  togglePasswordVisibility(field: 'newPassword' | 'confirmPassword') {
    if (field === 'newPassword') {
      this.showNewPassword = !this.showNewPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  // Obtener tipo de input para contraseña
  getPasswordInputType(field: 'newPassword' | 'confirmPassword'): string {
    if (field === 'newPassword') {
      return this.showNewPassword ? 'text' : 'password';
    } else {
      return this.showConfirmPassword ? 'text' : 'password';
    }
  }
}

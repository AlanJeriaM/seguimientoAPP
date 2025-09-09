import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';
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
  private emailPattern: string = "^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$";

  currentStep: 'email' | 'code' | 'password' = 'email';
  loading = false;
  emailSent = false;
  codeAttempts = 0;
  maxCodeAttempts = 3;
  countdown = 0;
  canResendCode = false;
  
  // Control para emails no válidos
  emailBlocked = false;
  blockedEmail = '';
  emailErrorType: 'not_found' | 'inactive' | 'none' = 'none';
  
  // Control para códigos agotados
  codeBlocked = false;
  
  // Control para formulario de contraseña completado
  passwordChangeCompleted = false;

  // Para mostrar/ocultar contraseñas
  showNewPassword = false;
  showConfirmPassword = false;

  stepItems = [
    { label: 'Correo' },
    { label: 'Código' },
    { label: 'Contraseña' }
  ];

  activeIndex = 0;

  // Propiedad computada para saber si puede verificar código
  get canVerifyCode(): boolean {
    return this.codeAttempts < this.maxCodeAttempts;
  }

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router
  ) {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.pattern(this.emailPattern)]],
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

    // Si el email está bloqueado, no permitir envío
    if (this.emailBlocked && this.blockedEmail === this.resetForm.get('email')?.value) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Email no válido',
        detail: 'Este correo no está registrado como administrador'
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
        this.resetEmailBlock();
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Código de verificación enviado al correo'
        });
      } else {
        // Manejar diferentes tipos de errores
        this.handleEmailError(response.msj, email);
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

  // Manejar errores de email
  private handleEmailError(errorMessage: string, email: string): void {
    if (errorMessage && errorMessage.includes('No se encontró un administrador')) {
      this.emailBlocked = true;
      this.blockedEmail = email;
      this.emailErrorType = 'not_found';
      this.messageService.add({
        severity: 'error',
        summary: 'Email no válido',
        detail: 'Este correo no está registrado como administrador'
      });
    } else if (errorMessage && errorMessage.includes('inactivo')) {
      this.emailBlocked = true;
      this.blockedEmail = email;
      this.emailErrorType = 'inactive';
      this.messageService.add({
        severity: 'error',
        summary: 'Cuenta inactiva',
        detail: 'La cuenta de administrador está inactiva'
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage || 'Error al enviar el código'
      });
    }
  }

  // Resetear bloqueo de email
  resetEmailBlock(): void {
    this.emailBlocked = false;
    this.blockedEmail = '';
    this.emailErrorType = 'none';
    // Resetear el estado touched del campo email para evitar validación inmediata
    this.resetForm.get('email')?.markAsUntouched();
  }

  // Limpiar email bloqueado y permitir nuevo intento
  clearBlockedEmail(): void {
    this.resetEmailBlock();
    this.resetForm.get('email')?.setValue('');
    this.resetForm.get('email')?.markAsUntouched();
    this.resetForm.get('email')?.markAsPristine();
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
          this.codeBlocked = true;
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
        this.passwordChangeCompleted = true;
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Contraseña cambiada correctamente. Redirigiendo al login...'
        });

        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
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
        this.codeBlocked = false;
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
      this.codeBlocked = false;
      this.resetEmailBlock();
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
    this.codeBlocked = false;
    this.passwordChangeCompleted = false;
    this.resetEmailBlock();
    this.resetForm.reset();
    this.codeForm.reset();
    this.newPasswordForm.reset();
    this.showNewPassword = false;
    this.showConfirmPassword = false;
  }

  // Toggle para mostrar/ocultar contraseñas
  togglePasswordVisibility(field: 'newPassword' | 'confirmPassword') {
    // No permitir toggle si está cargando o completado
    if (this.loading || this.passwordChangeCompleted) {
      return;
    }
    
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

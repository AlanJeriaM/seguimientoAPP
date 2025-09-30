import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { PrimeNGConfig, MessageService } from 'primeng/api';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  private emailPattern: string = "^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$";
  esAdmin: boolean = false;
  formularioLogin: FormGroup;
  isProduction: boolean = environment.production;

  // Variables para modales
  displayLoadingDialog: boolean = false;
  displaySuccessDialog: boolean = false;
  displayErrorDialog: boolean = false;
  loadingMessage: string = '';
  successMessage: string = '';
  errorMessage: string = '';
  errorTitle: string = '';
  isLoggingIn: boolean = false;

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private primengConfig: PrimeNGConfig,
    private messageService: MessageService
  ) {
    this.formularioLogin = this.fb.group({
      emailUsuario: ['', [Validators.required, Validators.pattern(this.emailPattern)]],
      contrasenia: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.primengConfig.ripple = true;

    this.route.queryParams.subscribe(params => {
      if (params['code'] && params['state']) {
        console.log('LinkedIn callback detectado');
        this.processLinkedInCallback(params['code'], params['state']);
      }
      if (params['error']) {
        console.error('Error en callback de LinkedIn:', params['error']);
        this.errorTitle = 'Error de LinkedIn';
        this.errorMessage = params['error_description'] || 'Error en la autenticación';
        this.displayErrorDialog = true;
      }
    });
  }

  login() {
    if (this.formularioLogin.invalid) {
      this.formularioLogin.markAllAsTouched();
      return;
    }

    this.isLoggingIn = true;
    this.loadingMessage = 'Iniciando sesión...';
    this.displayLoadingDialog = true;

    this.authService.login(this.formularioLogin.value).subscribe({
      next: (ok) => {
        this.displayLoadingDialog = false;
        this.isLoggingIn = false;

        if (ok === true) {
          this.successMessage = 'Accediendo al sistema...';
          this.displaySuccessDialog = true;

          // Cerrar modal de éxito y navegar después de un breve delay
          setTimeout(() => {
            this.displaySuccessDialog = false;
            this.router.navigate([this.esAdmin ? '/admin' : '/user']);
          }, 1000);
        } else {
          this.errorTitle = 'Error de autenticación';
          this.errorMessage = ok;
          this.displayErrorDialog = true;
          this.formularioLogin.get('contrasenia')?.reset();
        }
      },
      error: () => {
        this.displayLoadingDialog = false;
        this.isLoggingIn = false;
        this.errorTitle = 'Error de conexión';
        this.errorMessage = 'No se pudo conectar con el servidor';
        this.displayErrorDialog = true;
      }
    });
  }

  campoInvalido(campo: string) {
    return this.formularioLogin.controls[campo].errors && this.formularioLogin.controls[campo].touched;
  }

  resetForm() {
    this.formularioLogin.reset();
    this.formularioLogin.markAsUntouched();
  }

  // Métodos para cerrar modales
  cerrarErrorDialog() {
    this.displayErrorDialog = false;
    this.errorMessage = '';
    this.errorTitle = '';
  }

  cerrarSuccessDialog() {
    this.displaySuccessDialog = false;
    this.successMessage = '';
  }

  loginWithLinkedIn() {
    if (environment.useRealLinkedIn) {
      this.loginWithLinkedInReal();
    } else {
      this.loginWithLinkedInSimulado();
    }
  }

  private loginWithLinkedInReal() {
    console.log('Iniciando login real con LinkedIn...');

    this.isLoggingIn = true;
    this.loadingMessage = 'Conectando con LinkedIn...';
    this.displayLoadingDialog = true;

    this.authService.getLinkedInAuthUrl().subscribe({
      next: (resp) => {
        this.displayLoadingDialog = false;
        this.isLoggingIn = false;

        if (resp.ok) {
          console.log('URL de LinkedIn obtenida, redirigiendo...');
          window.location.href = resp.authUrl;
        } else {
          this.errorTitle = 'Error de LinkedIn';
          this.errorMessage = resp.msj || 'Error al conectar con LinkedIn';
          this.displayErrorDialog = true;
        }
      },
      error: (error) => {
        this.displayLoadingDialog = false;
        this.isLoggingIn = false;
        console.error('Error obteniendo URL de LinkedIn:', error);
        this.errorTitle = 'Error de conexión';
        this.errorMessage = 'Error de conexión con el servidor';
        this.displayErrorDialog = true;
      }
    });
  }

  private loginWithLinkedInSimulado() {
    console.log('Usando login simulado de LinkedIn...');

    const linkedinDataSimulado = {
      linkedin_id: `linkedin_dev_${Date.now()}`,
      nombre: `Usuario Desarrollo ${Math.floor(Math.random() * 1000)}`,
      correo: `dev.usuario${Math.floor(Math.random() * 1000)}@linkedin.com`,
      perfil_imagen_url: 'https://via.placeholder.com/150x150?text=DEV',
      posicion_actual: 'Desarrollador de Software',
      empresa_actual: 'Tech Company Dev',
      ubicacion: 'Santiago, Chile',
      resumen: 'Perfil de desarrollo para pruebas del sistema.',
      industria: 'Tecnología de la información'
    };

    this.isLoggingIn = true;
    this.loadingMessage = 'Conectando con LinkedIn... (Modo desarrollo)';
    this.displayLoadingDialog = true;

    setTimeout(() => {
      this.authService.loginLinkedIn(linkedinDataSimulado).subscribe({
        next: (ok) => {
          this.displayLoadingDialog = false;
          this.isLoggingIn = false;

          if (ok === true) {
            this.successMessage = 'Login con LinkedIn exitoso (Modo desarrollo)';
            this.displaySuccessDialog = true;

            setTimeout(() => {
              this.displaySuccessDialog = false;
              this.router.navigate(['/user']);
            }, 1500);
          } else {
            this.errorTitle = 'Error de LinkedIn';
            this.errorMessage = ok || 'Error al conectar con LinkedIn';
            this.displayErrorDialog = true;
          }
        },
        error: (error) => {
          this.displayLoadingDialog = false;
          this.isLoggingIn = false;
          console.error('Error en login simulado:', error);
          this.errorTitle = 'Error de desarrollo';
          this.errorMessage = 'Error en el login simulado';
          this.displayErrorDialog = true;
        }
      });
    }, 2000);
  }

  private processLinkedInCallback(code: string, state: string) {
    console.log('Procesando callback de LinkedIn...');

    this.isLoggingIn = true;
    this.loadingMessage = 'Procesando autenticación...';
    this.displayLoadingDialog = true;

    this.authService.processLinkedInCallback(code, state).subscribe({
      next: (ok) => {
        this.displayLoadingDialog = false;
        this.isLoggingIn = false;

        if (ok === true) {
          this.successMessage = 'Autenticación exitosa';
          this.displaySuccessDialog = true;

          setTimeout(() => {
            this.displaySuccessDialog = false;
            this.router.navigate(['/user']);
          }, 1500);
        } else {
          this.errorTitle = 'Error de autenticación';
          this.errorMessage = ok || 'Error al procesar la autenticación';
          this.displayErrorDialog = true;

          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 2000);
        }
      },
      error: (error) => {
        this.displayLoadingDialog = false;
        this.isLoggingIn = false;
        console.error('Error procesando callback:', error);
        this.errorTitle = 'Error de procesamiento';
        this.errorMessage = 'Error procesando la autenticación';
        this.displayErrorDialog = true;

        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      }
    });
  }
}

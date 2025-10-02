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

  // Variables para el modal dinámico unificado
  displayModal: boolean = false;
  isLoggingIn: boolean = false;
  
  // Variables para el modal dinámico
  modalIcon: string = 'pi pi-spin pi-spinner';
  modalTitle: string = 'Procesando';
  modalMessage: string = '';
  modalType: 'loading' | 'success' | 'error' = 'loading';
  isProcessingComplete: boolean = false;

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
          this.changeModalState('error', 'pi pi-times', 'Error de LinkedIn', params['error_description'] || 'Error en la autenticación');
          this.displayModal = true;
        }
    });
  }

  login() {
    if (this.formularioLogin.invalid) {
      this.formularioLogin.markAllAsTouched();
      return;
    }

    this.isLoggingIn = true;
    this.changeModalState('loading', 'pi pi-spin pi-spinner', 'Procesando', 'Iniciando sesión...');
    this.displayModal = true;

    this.authService.login(this.formularioLogin.value).subscribe({
      next: (ok) => {
        if (ok === true) {
          // Cambiar a estado de éxito sin cerrar el modal
          this.changeModalState('success', 'pi pi-check', '¡Éxito!', 'Accediendo al sistema...', true);

          setTimeout(() => {
            this.router.navigate([this.esAdmin ? '/admin' : '/user']);
            // El modal se cerrará automáticamente al cambiar de ruta
          }, 800);
        } else {
          // Cambiar a estado de error
          this.changeModalState('error', 'pi pi-times', 'Error de autenticación', ok);
          this.isLoggingIn = false;
          this.formularioLogin.get('contrasenia')?.reset();
        }
      },
      error: () => {
        this.changeModalState('error', 'pi pi-times', 'Error de conexión', 'No se pudo conectar con el servidor');
        this.isLoggingIn = false;
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

  cerrarModal() {
    this.displayModal = false;
    this.modalMessage = '';
    this.modalTitle = 'Procesando';
    this.modalType = 'loading';
    this.isProcessingComplete = false;
  }

  // Método para cambiar el estado del modal dinámico
  private changeModalState(type: 'loading' | 'success' | 'error', icon: string, title: string, message: string, isComplete: boolean = false) {
    this.modalType = type;
    this.modalIcon = icon;
    this.modalTitle = title;
    this.modalMessage = message;
    this.isProcessingComplete = isComplete;
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

    // Activar loading INMEDIATAMENTE antes de cualquier operación
    this.isLoggingIn = true;
    this.changeModalState('loading', 'pi pi-spin pi-spinner', 'Procesando', 'Conectando con LinkedIn...');
    this.displayModal = true;

    this.authService.getLinkedInAuthUrl().subscribe({
      next: (resp) => {
        if (resp.ok) {
          console.log('URL de LinkedIn obtenida, redirigiendo...');
          // Cambiar a estado de redirección
          this.changeModalState('loading', 'pi pi-external-link', 'Redirigiendo', 'Redirigiendo a LinkedIn...');

          // Dar un momento para que el usuario vea el modal antes de redireccionar
          setTimeout(() => {
            window.location.href = resp.authUrl;
            // NO cerrar el loading aquí - se mantendrá visible durante la redirección
          }, 500);
        } else {
          this.changeModalState('error', 'pi pi-times', 'Error de LinkedIn', resp.msj || 'Error al conectar con LinkedIn');
          this.isLoggingIn = false;
        }
      },
      error: (error) => {
        console.error('Error obteniendo URL de LinkedIn:', error);
        this.changeModalState('error', 'pi pi-times', 'Error de conexión', 'Error de conexión con el servidor');
        this.isLoggingIn = false;
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
    this.changeModalState('loading', 'pi pi-spin pi-spinner', 'Procesando', 'Conectando con LinkedIn...');
    this.displayModal = true;

    setTimeout(() => {
      this.authService.loginLinkedIn(linkedinDataSimulado).subscribe({
        next: (ok) => {
          if (ok === true) {
            // Cambiar a estado de éxito
            this.changeModalState('success', 'pi pi-check', '¡Éxito!', 'Accediendo al portal...', true);

            setTimeout(() => {
              this.router.navigate(['/user']);
              // El modal se cerrará automáticamente al cambiar de ruta
            }, 800);
          } else {
            // Cambiar a estado de error
            this.changeModalState('error', 'pi pi-times', 'Error de LinkedIn', ok || 'Error al conectar con LinkedIn');
            this.isLoggingIn = false;
          }
        },
        error: (error) => {
          console.error('Error en login simulado:', error);
          this.changeModalState('error', 'pi pi-times', 'Error de desarrollo', 'Error en el login simulado');
          this.isLoggingIn = false;
        }
      });
    }, 1000);
  }

  private processLinkedInCallback(code: string, state: string) {
    console.log('Procesando callback de LinkedIn...');

    this.isLoggingIn = true;
    this.changeModalState('loading', 'pi pi-spin pi-spinner', 'Procesando', 'Procesando autenticación...');
    this.displayModal = true;

    this.authService.processLinkedInCallback(code, state).subscribe({
      next: (ok) => {
        if (ok === true) {
          // Cambiar a estado de éxito
          this.changeModalState('success', 'pi pi-check', '¡Éxito!', 'Accediendo al portal...', true);

          setTimeout(() => {
            this.router.navigate(['/user']);
            // El modal se cerrará automáticamente al cambiar de ruta
          }, 800);
        } else {
          // Cambiar a estado de error
          this.changeModalState('error', 'pi pi-times', 'Error de autenticación', ok || 'Error al procesar la autenticación');
          this.isLoggingIn = false;

          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 2000);
        }
      },
      error: (error) => {
        console.error('Error procesando callback:', error);
        this.changeModalState('error', 'pi pi-times', 'Error de procesamiento', 'Error procesando la autenticación');
        this.isLoggingIn = false;

        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      }
    });
  }
}

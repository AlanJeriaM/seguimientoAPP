import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { PrimeNGConfig } from 'primeng/api';
import Swal from 'sweetalert2';
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

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private primengConfig: PrimeNGConfig
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
        Swal.fire({
          icon: 'error',
          title: 'Error de LinkedIn',
          text: params['error_description'] || 'Error en la autenticación'
        });
      }
    });
  }

  login() {
    if (this.formularioLogin.invalid) {
      this.formularioLogin.markAllAsTouched();
      return;
    }

    Swal.fire({
      title: 'Iniciando sesión...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.authService.login(this.formularioLogin.value).subscribe({
      next: (ok) => {
        Swal.close();

        if (ok === true) {
          Swal.fire({
            icon: 'success',
            title: 'Accediendo',
            showConfirmButton: false,
            timer: 1000,
          });

          this.router.navigate([this.esAdmin ? '/admin' : '/user']);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: ok,
            showConfirmButton: true,
          });

          this.formularioLogin.get('contrasenia')?.reset();
        }
      },
      error: () => {
        Swal.close();
        Swal.fire({
          icon: 'error',
          title: 'Error de conexión',
          text: 'No se pudo conectar con el servidor',
          showConfirmButton: true,
        });
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

  loginWithLinkedIn() {
    if (this.isProduction) {
      this.loginWithLinkedInReal();
    } else {
      this.loginWithLinkedInSimulado();
    }
  }

  private loginWithLinkedInReal() {
    console.log('Iniciando login real con LinkedIn...');

    Swal.fire({
      title: 'Conectando con LinkedIn...',
      text: 'Te redirigiremos a LinkedIn para autorizar el acceso',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.authService.getLinkedInAuthUrl().subscribe({
      next: (resp) => {
        Swal.close();

        if (resp.ok) {
          console.log('URL de LinkedIn obtenida, redirigiendo...');
          window.location.href = resp.authUrl;
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: resp.msj || 'Error al conectar con LinkedIn'
          });
        }
      },
      error: (error) => {
        Swal.close();
        console.error('Error obteniendo URL de LinkedIn:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error de conexión con el servidor'
        });
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

    Swal.fire({
      title: 'Conectando con LinkedIn...',
      text: 'Modo desarrollo activado',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    setTimeout(() => {
      this.authService.loginLinkedIn(linkedinDataSimulado).subscribe({
        next: (ok) => {
          Swal.close();

          if (ok === true) {
            Swal.fire({
              icon: 'success',
              title: '¡Bienvenido!',
              text: 'Login con LinkedIn exitoso (Modo desarrollo)',
              showConfirmButton: false,
              timer: 1500,
            });

            this.router.navigate(['/user']);
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: ok || 'Error al conectar con LinkedIn',
              showConfirmButton: true,
            });
          }
        },
        error: (error) => {
          Swal.close();
          console.error('Error en login simulado:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error en el login simulado',
            showConfirmButton: true,
          });
        }
      });
    }, 2000);
  }

  private processLinkedInCallback(code: string, state: string) {
    console.log('Procesando callback de LinkedIn...');

    Swal.fire({
      title: 'Procesando autenticación...',
      text: 'Validando credenciales con LinkedIn',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.authService.processLinkedInCallback(code, state).subscribe({
      next: (ok) => {
        Swal.close();

        if (ok === true) {
          Swal.fire({
            icon: 'success',
            title: '¡Bienvenido!',
            text: 'Autenticación exitosa',
            showConfirmButton: false,
            timer: 1500,
          });

          this.router.navigate(['/user']);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error de autenticación',
            text: ok || 'Error al procesar la autenticación',
          });

          this.router.navigate(['/auth/login']);
        }
      },
      error: (error) => {
        Swal.close();
        console.error('Error procesando callback:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error procesando la autenticación',
        });

        this.router.navigate(['/auth/login']);
      }
    });
  }
}

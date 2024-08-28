import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth/auth.service';
import { Router } from '@angular/router';
import { PrimeNGConfig } from 'primeng/api';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  providers: [PrimeNGConfig]
})
export class LoginComponent implements OnInit {

  private emailPattern: string = "^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$";  //expresion regular que valida que el correo ingresado tenga un formato correcto.
  esAdmin: boolean = false;  // un booleano que indica si el usuario es administrador
  formularioLogin: FormGroup; // un objeto de 'FormGroup' que representa el formulario de inicio de sesion

  constructor(
    private fb: FormBuilder,  // utilizado para construir el formulario
    private authService: AuthService, // servicio para manejar la autenticacion
    private router: Router, // para navegar dentro de la aplicacion
    private primengConfig: PrimeNGConfig // para configurar opciones de primeNG
  ) {

    // Inicializar el formulario en el constructor
    this.formularioLogin = this.fb.group({
      emailUsuario: [ //emailUsuario es un campo de correo electronico que es obligatorio y debe coincidir con el patron definido en emailPattern
        '',
        [
          Validators.required,
          Validators.pattern(this.emailPattern)
        ],
      ],
      contrasenia: ['', Validators.required]
    });
  }

  //Este método se ejecuta cuando el componente se inicializa. En este caso, habilita el efecto "ripple" de PrimeNG.
  ngOnInit(): void {
    this.primengConfig.ripple = true;
  }


  login() {
    if (this.formularioLogin.invalid) {
      this.formularioLogin.markAllAsTouched();
      return;
    }

    this.authService.login(this.formularioLogin.value).subscribe(ok => {
      if (ok === true) {
        Swal.fire({
          icon: 'success',
          title: 'Accediendo',
          showConfirmButton: false,
          timer: 1000,
        });

        if (this.esAdmin) {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/user']);
        }

      } else {
        // mostrar mensaje de error
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: ok,
          showConfirmButton: false,
          timer: 1000,
        });

        this.formularioLogin.get('contrasenia')?.reset();
      }
    });
  }

  campoInvalido(campo: string) {
    return this.formularioLogin.controls[campo].errors
      && this.formularioLogin.controls[campo].touched;
  }

  resetForm() {
    this.formularioLogin.reset();
    this.formularioLogin.markAsUntouched(); // Establece todos los campos como no tocados.
  }

  loginWithLinkedIn() {
    // Aquí va la lógica para iniciar sesión con LinkedIn
    // Puede redirigir a una página de autenticación o hacer una llamada a un servicio
  }
}

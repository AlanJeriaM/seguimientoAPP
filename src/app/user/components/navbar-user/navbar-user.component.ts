import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';

@Component({
  selector: 'app-navbar-user',
  templateUrl: './navbar-user.component.html',
  styleUrls: ['./navbar-user.component.css'] // <-- Corregir 'styleUrl' a 'styleUrls'
})
export class NavbarUserComponent implements OnInit {

  userName: string = '';

  constructor(
    private router: Router,
    private authService: AuthService,
  ) { }

  ngOnInit(): void {
    this.userName = this.authService.usuario.nombreUsuario;
  }

  public logOut() {
    this.authService.logOut();
    this.router.navigate(['visitor']);
  }
}

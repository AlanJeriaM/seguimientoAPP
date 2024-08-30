import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-navbar-user',
  templateUrl: './navbar-user.component.html',
  styleUrls: ['./navbar-user.component.css']
})
export class NavbarUserComponent implements OnInit {

  userName: string = '';
  menuItems: MenuItem[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
  ) { }

  ngOnInit(): void {
    this.userName = this.authService.usuario.nombreUsuario;
    this.menuItems = [
      { label: 'Mi Perfil',
        icon: 'pi pi-user',
        routerLink: '/user/my-profile' },
      { separator: true },
      { label: 'Cerrar sesión',
        icon: 'pi pi-sign-out',
        command: () => this.logOut() }
    ];
  }

  public logOut() {
    this.authService.logOut();
    this.router.navigate(['auth']);
  }
}

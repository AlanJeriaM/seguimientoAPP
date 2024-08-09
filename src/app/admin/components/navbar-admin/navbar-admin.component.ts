import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-navbar-admin',
  templateUrl: './navbar-admin.component.html',
  styleUrls: ['./navbar-admin.component.css']
})
export class NavbarAdminComponent implements OnInit {
  nombreUsuario: string = '';
  menuItems: MenuItem[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
  ) { }

  ngOnInit(): void {
    this.nombreUsuario = this.authService.usuario.nombreUsuario;
    this.menuItems = [
      { label: 'Mi Perfil',
        icon: 'pi pi-user',
        routerLink: '/admin/my-profile' },
      { separator: true },
      { label: 'Cerrar sesión',
        icon: 'pi pi-sign-out',
        command: () => this.logOut() }
    ];


  }

  logOut() {
    this.authService.logOut();
    this.router.navigate(['visitor']);
  }
}

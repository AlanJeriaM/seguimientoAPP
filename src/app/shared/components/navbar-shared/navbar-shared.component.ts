import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-navbar-shared',
  templateUrl: './navbar-shared.component.html',
  styleUrls: ['./navbar-shared.component.css']
})
export class NavbarSharedComponent implements OnInit {

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
        routerLink: this.isAdmin() ? '/admin/my-profile' : '/user/my-profile' },
      { separator: true },

      { label: 'Cerrar sesión',
        icon: 'pi pi-sign-out',
        command: () => this.logOut() }
    ];

  }


  //métodos para verificar si la URL actual comienza con /admin o /auth o /user.
  isAdmin(): boolean {
    return this.router.url.startsWith('/admin');
  }

  isUser(): boolean {
    return this.router.url.startsWith('/user');
  }

  isAuth(): boolean {
    return this.router.url.startsWith('/auth');
  }

  logOut() {
    this.authService.logOut();
    this.router.navigate(['auth']);
  }
}

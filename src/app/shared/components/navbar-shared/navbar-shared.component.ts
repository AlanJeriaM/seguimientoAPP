import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { NotificacionService, Notificacion } from '../../../core/services/notificacion/notificacion.service';
import { MenuItem } from 'primeng/api';
import { OverlayPanel } from 'primeng/overlaypanel';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-navbar-shared',
  templateUrl: './navbar-shared.component.html',
  styleUrls: ['./navbar-shared.component.css']
})
export class NavbarSharedComponent implements OnInit, OnDestroy {
  @ViewChild('notificationPanel') notificationPanel!: OverlayPanel;

  userName: string = '';
  perfilImagenUrl: string = '';
  menuItems: MenuItem[] = [];

  // Propiedades para notificaciones
  notificaciones: Notificacion[] = [];
  contadorNoLeidas: number = 0;
  cargandoNotificaciones: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private authService: AuthService,
    private notificacionService: NotificacionService
  ) { }

  ngOnInit(): void {
    // Solo inicializar si hay un usuario autenticado
    if (this.authService.usuario && this.authService.usuario.nombreUsuario) {
      this.userName = this.authService.usuario.nombreUsuario;
      this.menuItems = [
        {
          label: 'Mi Perfil',
          icon: 'pi pi-user',
          routerLink: this.isAdmin() ? '/admin/mi-perfil' : '/user/mi-perfil'
        },
        { separator: true },
        {
          label: 'Cerrar sesión',
          icon: 'pi pi-sign-out',
          command: () => this.logOut()
        }
      ];

      // Solo inicializar notificaciones para usuarios autenticados
      if (this.isUser()) {
        this.inicializarNotificaciones();
        this.obtenerPerfilUsuario();
      }
    } else {
      // Usuario no autenticado - mostrar solo opciones básicas
      this.menuItems = [
        {
          label: 'Iniciar Sesión',
          icon: 'pi pi-sign-in',
          routerLink: '/auth/login'
        }
      ];
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private inicializarNotificaciones(): void {
    // Suscribirse al contador de notificaciones no leídas
    this.notificacionService.contadorNoLeidas$
      .pipe(takeUntil(this.destroy$))
      .subscribe(contador => {
        this.contadorNoLeidas = contador;
      });

    // Inicializar el servicio
    this.notificacionService.inicializar();
  }

  private obtenerPerfilUsuario(): void {
    this.authService.obtenerMiPerfil()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.ok && response.usuario) {
            this.perfilImagenUrl = response.usuario.perfil_imagen_url || '';
            console.log('Perfil obtenido para sidebar:', {
              nombre: response.usuario.nombre,
              perfil_imagen_url: response.usuario.perfil_imagen_url
            });
          }
        },
        error: (error) => {
          console.error('Error al obtener perfil para sidebar:', error);
        }
      });
  }

  // Método auxiliar para obtener la ruta de inicio
  getHomeRoute(): string {
    if (this.isAuth()) {
      return '/auth/login';
    }
    return this.isAdmin() ? '/admin/dashboard' : '/user/dashboard';
  }

  // Métodos para verificar si la URL actual comienza con /admin o /auth o /user.
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
    this.confirmLogout();
  }

  private confirmLogout() {
    Swal.fire({
      title: '¿Estás seguro que quieres cerrar sesión?',
      text: 'Serás redirigido a la página de inicio de sesión',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981', // Verde
      cancelButtonColor: '#ef4444',  // Rojo
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'No, mantener sesión',
      reverseButtons: true,
      customClass: {
        actions: 'my-swal-actions'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.logOut();
        this.router.navigate(['auth']);
      }
    });
  }

  // Métodos para notificaciones
  toggleNotificaciones(event: Event): void {
    if (this.notificationPanel.overlayVisible) {
      this.notificationPanel.hide();
    } else {
      this.cargarNotificaciones();
      this.notificationPanel.toggle(event);
    }
  }

  private cargarNotificaciones(): void {
    this.cargandoNotificaciones = true;
    this.notificacionService.obtenerNotificaciones(1, 10).subscribe({
      next: (response) => {
        if (response.ok) {
          this.notificaciones = response.data.notificaciones;
        }
        this.cargandoNotificaciones = false;
      },
      error: (error) => {
        console.error('Error al cargar notificaciones:', error);
        this.cargandoNotificaciones = false;
      }
    });
  }

  abrirNotificacion(notificacion: Notificacion): void {
    // Marcar como leída si no lo está
    if (!notificacion.leida) {
      this.notificacionService.marcarComoLeida(notificacion.id).subscribe({
        next: () => {
          notificacion.leida = true;
          this.notificacionService.decrementarContador();
        },
        error: (error) => {
          console.error('Error al marcar notificación como leída:', error);
        }
      });
    }

    // Cerrar panel y navegar según el tipo de notificación
    this.notificationPanel.hide();

    if (notificacion.tipo === 'NUEVA_ENCUESTA') {
      // Navegar a view-encuestas y resaltar la encuesta específica
      this.router.navigate(['/user/view-encuestas'], {
        queryParams: { encuesta_id: notificacion.encuesta_id, destacar: true }
      });
    }
  }

  marcarTodasComoLeidas(): void {
    const notificacionesNoLeidas = this.notificaciones.filter(n => !n.leida);

    notificacionesNoLeidas.forEach(notificacion => {
      this.notificacionService.marcarComoLeida(notificacion.id).subscribe({
        next: () => {
          notificacion.leida = true;
        },
        error: (error) => {
          console.error('Error al marcar notificación como leída:', error);
        }
      });
    });

    // Actualizar contador
    this.notificacionService.actualizarContadorNoLeidas();
  }

  verTodasLasNotificaciones(): void {
    this.notificationPanel.hide();
    // Podrías crear una página dedicada para ver todas las notificaciones
    // this.router.navigate(['/user/notificaciones']);
  }

  getNotificationIcon(tipo: string): string {
    switch (tipo) {
      case 'NUEVA_ENCUESTA':
        return 'pi pi-file-plus';
      case 'RECORDATORIO':
        return 'pi pi-clock';
      case 'ENCUESTA_COMPLETADA':
        return 'pi pi-check-circle';
      case 'SISTEMA':
        return 'pi pi-info-circle';
      default:
        return 'pi pi-bell';
    }
  }

  getNotificationIconClass(tipo: string): string {
    switch (tipo) {
      case 'NUEVA_ENCUESTA':
        return 'text-blue-500';
      case 'RECORDATORIO':
        return 'text-orange-500';
      case 'ENCUESTA_COMPLETADA':
        return 'text-green-500';
      case 'SISTEMA':
        return 'text-purple-500';
      default:
        return 'text-gray-500';
    }
  }
}

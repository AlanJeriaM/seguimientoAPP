import { Component, Input, OnInit, Renderer2 } from '@angular/core';
import { MenuItem, PrimeNGConfig } from 'primeng/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {

  @Input() nameUser!: string;
  @Input() isAdmin: boolean = false;
  @Input() perfilImagenUrl?: string;

  visibleSidebar: boolean = false; // Cambiado a false por defecto
  itemsPanelMenu: MenuItem[] = [];
  imageError: boolean = false;

  constructor(
    private primengConfig: PrimeNGConfig,
    private router: Router,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.primengConfig.ripple = true;
    this.itemsPanelMenu = this.isAdmin ? this.getAdminMenuItems() : this.getUserMenuItems();
  }

  // Determinar si el sidebar debe ser modal basado en el tamaño de pantalla
  // Solo en desktop (>1280px) empuja el contenido, resto es modal
  isModalMode(): boolean {
    return window.innerWidth <= 1280;
  }

  toggleSidebar() {
    this.visibleSidebar = !this.visibleSidebar;

    // Agregar o quitar clase al body para controlar el margen del contenido
    if (this.visibleSidebar) {
      this.renderer.addClass(document.body, 'sidebar-open');
    } else {
      this.renderer.removeClass(document.body, 'sidebar-open');
    }
  }

  goToPerfil() {
    if (this.isAdmin) {
      this.router.navigate(['/admin/mi-perfil']);
    } else {
      this.router.navigate(['/user/mi-perfil']);
    }
    this.visibleSidebar = false;
    this.renderer.removeClass(document.body, 'sidebar-open');
  }

  handleImageError(event: any) {
    this.imageError = true;
  }

  getUserInitials(): string {
    if (!this.nameUser) return 'U';
    const names = this.nameUser.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }

  navigateToChart(chartId: string): void {
    this.visibleSidebar = false;
    this.renderer.removeClass(document.body, 'sidebar-open');

    const dashboardRoute = this.isAdmin ? '/admin/dashboard' : '/user/dashboard';

    if (this.router.url === dashboardRoute) {
      this.scrollToElement(chartId);
    } else {
      this.router.navigate([dashboardRoute]).then(() => {
        this.scrollToElement(chartId);
      });
    }
  }

  private scrollToElement(elementId: string): void {
    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element) {
        const navbar = document.querySelector('.custom-toolbar') as HTMLElement;
        const navbarHeight = navbar ? navbar.offsetHeight : 100;
        const navbarOffset = navbarHeight + 20;

        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - navbarOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      } else {
        console.warn(`Elemento con ID '${elementId}' no encontrado`);
      }
    }, 300);
  }

  private getAdminMenuItems(): MenuItem[] {
    return [
      {
        label: 'Reporte egresados',
        icon: 'pi pi-chart-bar',
        iconStyle: {'color': '#3B82F6'},
        items: [
          { label: 'Dashboard principal', icon: 'pi pi-fw pi-home', routerLink: '/admin/dashboard' },
          {
            label: 'Análisis laboral',
            icon: 'pi pi-fw pi-briefcase',
            items: [
              { label: 'Análisis salarial', command: () => this.navigateToChart('distribucion-salarial') },
              { label: 'Tecnologías mas usadas', command: () => this.navigateToChart('tecnologias-demandadas') },
              { label: 'Satisfacción laboral',  command: () => this.navigateToChart('salarios-industria') },
            ]
          },
          {
            label: 'Experiencia y tecnologías',
            icon: 'pi pi-fw pi-users',
            items: [
              { label: 'Análisis de experiencia', command: () => this.navigateToChart('distribucion-experiencia') },
              { label: 'Tecnologías vs Experiencia', command: () => this.navigateToChart('experiencia-tecnologias') },
            ]
          },
          {
            label: 'Indicadores avanzados',
            icon: 'pi pi-fw pi-chart-line',
            items: [
              { label: 'Mapa de calor', command: () => this.navigateToChart('mapa-calor-industria') },
              { label: 'Estado del mercado',  command: () => this.navigateToChart('disponibilidad-cambio') },
              { label: 'Métricas avanzadas', command: () => this.navigateToChart('metricas-avanzadas') },
            ]
          }
        ]
      },

      { label: 'Administradores', icon: 'pi pi-user-edit', items: [
        { label: 'Administradores activos', icon: 'pi pi-fw pi-users', routerLink: '/admin/view-admin' },
        { label: 'Administradores eliminados', icon: 'pi pi-fw pi-trash', routerLink: '/admin/view-deleted-admin' }
      ]},

      { label: 'Usuarios', icon: 'pi pi-users', items: [
          { label: 'Usuarios activos', icon: 'pi pi-fw pi-users', routerLink: '/admin/view-users' },
          { label: 'Usuarios eliminados', icon: 'pi pi-fw pi-trash', routerLink: '/admin/view-deleted-users' }
        ]
      },
      { label: 'Encuestas', icon: 'pi pi-book', items: [
          { label: 'Crear', icon: 'pi pi-fw pi-bookmark', routerLink: '/admin/create-encuesta' },
          { label: 'Mis encuestas', icon: 'pi pi-fw pi-bookmark-fill', routerLink: '/admin/view-encuesta' },
          { label: 'Resultados', icon: 'pi pi-fw pi-chart-bar', routerLink: '/admin/view-encuestas-resultados' }
        ]
      }
    ];
  }

  private getUserMenuItems(): MenuItem[] {
    return [
      {
        label: 'Reporte egresados',
        icon: 'pi pi-chart-bar',
        iconStyle: {'color': '#3B82F6'},
        items: [
          { label: 'Dashboard principal', icon: 'pi pi-fw pi-home', routerLink: '/user/dashboard' },
          {
            label: 'Análisis laboral',
            icon: 'pi pi-fw pi-briefcase',
            items: [
              { label: 'Análisis salarial',  command: () => this.navigateToChart('distribucion-salarial') },
              { label: 'Tecnologías mas usadas',  command: () => this.navigateToChart('tecnologias-demandadas') },
              { label: 'Satisfacción laboral',  command: () => this.navigateToChart('salarios-industria') },
            ]
          },
          {
            label: 'Experiencia y tecnologías',
            icon: 'pi pi-fw pi-users',
            items: [
              { label: 'Análisis de experiencia',  command: () => this.navigateToChart('distribucion-experiencia') },
              { label: 'Tecnologías vs Experiencia',  command: () => this.navigateToChart('experiencia-tecnologias') },
            ]
          },
          {
            label: 'Indicadores avanzados',
            icon: 'pi pi-fw pi-chart-line',
            items: [
              { label: 'Mapa de calor',command: () => this.navigateToChart('mapa-calor-industria') },
              { label: 'Estado del mercado', command: () => this.navigateToChart('disponibilidad-cambio') },
              { label: 'Métricas avanzadas', command: () => this.navigateToChart('metricas-avanzadas') },
            ]
          }
        ]
      },
      { label: 'Encuestas', icon: 'pi pi-users', items: [
          { label: 'Mis encuestas', icon: 'pi pi-file-edit', routerLink: '/user/view-encuestas' },
          { label: 'Encuestas completadas', icon: 'pi pi-check', routerLink: '/user/encuesta-completada' }
        ]
      }
    ];
  }
}

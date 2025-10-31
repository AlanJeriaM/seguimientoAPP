import { Component, Input, OnInit, Renderer2, OnDestroy, HostListener } from '@angular/core';
import { MenuItem, PrimeNGConfig } from 'primeng/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit, OnDestroy {

  @Input() nameUser!: string;
  @Input() isAdmin: boolean = false;
  @Input() perfilImagenUrl?: string;

  visibleSidebar: boolean = false;
  itemsPanelMenu: MenuItem[] = [];
  imageError: boolean = false;
  private currentScreenWidth: number = 0;

  constructor(
    private primengConfig: PrimeNGConfig,
    private router: Router,
    private renderer: Renderer2
  ) {}

  // Detectar cambios de tamaño de ventana
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    const newWidth = window.innerWidth;
    const oldIsModal = this.currentScreenWidth <= 1280;
    const newIsModal = newWidth <= 1280;

    // Solo actuar si hubo un cambio real en el modo (cruzó el breakpoint de 1280px)
    if (oldIsModal !== newIsModal && this.visibleSidebar) {
      this.handleModeChange(newIsModal);
    }

    this.currentScreenWidth = newWidth;
  }

  ngOnInit(): void {
    this.primengConfig.ripple = true;
    this.itemsPanelMenu = this.isAdmin ? this.getAdminMenuItems() : this.getUserMenuItems();
    this.currentScreenWidth = window.innerWidth;
  }

  ngOnDestroy(): void {
    this.removeBodyClass();
    const sidebarElement = document.querySelector('.p-sidebar');
    if (sidebarElement) {
      sidebarElement.classList.add('hiding');
    }
    this.visibleSidebar = false;
  }

  // Manejar cambio de modo (modal <-> push)
  private handleModeChange(isModal: boolean): void {
    // Cerrar sidebar
    this.visibleSidebar = false;
    this.removeBodyClass();

    // Limpiar overlay si existe
    const overlay = document.querySelector('.p-sidebar-mask');
    if (overlay) {
      overlay.remove();
    }

    // Reabrir sidebar con el nuevo modo después de un breve delay
    setTimeout(() => {
      this.visibleSidebar = true;
      setTimeout(() => {
        this.renderer.addClass(document.body, 'sidebar-open');
      }, 50);
    }, 150);
  }

  public removeBodyClass(): void {
    this.renderer.removeClass(document.body, 'sidebar-open');
  }

  public hideImmediately(): void {
    this.visibleSidebar = false;
    this.removeBodyClass();
    const sidebarElement = document.querySelector('.p-sidebar');
    if (sidebarElement) {
      sidebarElement.classList.add('instant-hide');
    }
    // Limpiar overlay si existe
    const overlay = document.querySelector('.p-sidebar-mask');
    if (overlay) {
      overlay.remove();
    }
  }

  isModalMode(): boolean {
    return window.innerWidth <= 1280;
  }

  toggleSidebar() {
    this.visibleSidebar = !this.visibleSidebar;

    if (this.visibleSidebar) {
      // Sidebar se está abriendo
      setTimeout(() => {
        this.renderer.addClass(document.body, 'sidebar-open');
        window.dispatchEvent(new Event('resize'));
      }, 0);
    } else {
      // Sidebar se está cerrando
      this.removeBodyClass();

      // Limpiar overlay si existe
      setTimeout(() => {
        const overlay = document.querySelector('.p-sidebar-mask');
        if (overlay) {
          overlay.remove();
        }
      }, 50);
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

  // Aplicar solo si necesito hacer click en un item del menú para cerrar el sidebar.
  private closeSidebarOnNavigate(): void {
    this.visibleSidebar = false;
    this.renderer.removeClass(document.body, 'sidebar-open');
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
          { label: 'Dashboard principal', icon: 'pi pi-fw pi-home', routerLink: '/admin/dashboard', command: () => this.closeSidebarOnNavigate()  },
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

      { label: 'Administradores', icon: 'pi pi-user-edit',
        items: [
            { label: 'Administradores activos', icon: 'pi pi-fw pi-users', routerLink: '/admin/view-admin', command: () => this.closeSidebarOnNavigate()  },
            { label: 'Administradores eliminados', icon: 'pi pi-fw pi-trash', routerLink: '/admin/view-deleted-admin', command: () => this.closeSidebarOnNavigate()  }
        ]
      },

      { label: 'Usuarios', icon: 'pi pi-users',
        items: [
          { label: 'Usuarios activos', icon: 'pi pi-fw pi-users', routerLink: '/admin/view-users', command: () => this.closeSidebarOnNavigate()  },
          { label: 'Usuarios eliminados', icon: 'pi pi-fw pi-trash', routerLink: '/admin/view-deleted-users', command: () => this.closeSidebarOnNavigate()  }
        ]
      },
      { label: 'Encuestas', icon: 'pi pi-book',
        items: [
          { label: 'Crear', icon: 'pi pi-fw pi-bookmark', routerLink: '/admin/create-encuesta', command: () => this.closeSidebarOnNavigate()  },
          { label: 'Mis encuestas', icon: 'pi pi-fw pi-bookmark-fill', routerLink: '/admin/view-encuesta' , command: () => this.closeSidebarOnNavigate()  },
          { label: 'Resultados', icon: 'pi pi-fw pi-chart-bar', routerLink: '/admin/view-encuestas-resultados', command: () => this.closeSidebarOnNavigate()  }
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
          { label: 'Dashboard principal', icon: 'pi pi-fw pi-home', routerLink: '/user/dashboard', command: () => this.closeSidebarOnNavigate() },
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
          { label: 'Mis encuestas', icon: 'pi pi-file-edit', routerLink: '/user/view-encuestas', command: () => this.closeSidebarOnNavigate()   },
          { label: 'Encuestas completadas', icon: 'pi pi-check', routerLink: '/user/encuesta-completada', command: () => this.closeSidebarOnNavigate()  }
        ]
      }
    ];
  }
}

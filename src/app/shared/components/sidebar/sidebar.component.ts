
import { Component, Input, OnInit } from '@angular/core';
import { MenuItem, PrimeNGConfig } from 'primeng/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {

  @Input() nameUser!: string; //Propiedad que recibe un valor del componente padre, en este caso el nombre del usuario.
  @Input() isAdmin: boolean = false; //Propiedad que indica si el usuario es administrador (true) o no (false). Por defecto, es false.
  @Input() perfilImagenUrl?: string; //Propiedad que recibe la URL de la imagen de perfil de LinkedIn


  visibleSidebar: boolean = true; //Propiedad que controla la visibilidad del sidebar. Inicialmente, es true, lo que significa que el sidebar está visible.
  itemsPanelMenu: MenuItem[] = []; //Array que almacena los ítems del menú que se mostrarán en el sidebar.
  imageError: boolean = false; //Propiedad para manejar errores de carga de imagen

  constructor(private primengConfig: PrimeNGConfig, private router: Router) {}

  ngOnInit(): void {
    this.primengConfig.ripple = true;
    this.itemsPanelMenu = this.isAdmin ? this.getAdminMenuItems() : this.getUserMenuItems(); //Dependiendo del valor de isAdmin, se asignan los ítems del menú correspondientes.
  }

  //Método que invierte el valor de visibleSidebar para alternar la visibilidad del sidebar.
  toggleSidebar() {
    this.visibleSidebar = !this.visibleSidebar;
  }

  goToPerfil() {
    if (this.isAdmin) {
      this.router.navigate(['/admin/mi-perfil']);
    } else {
      this.router.navigate(['/user/mi-perfil']);
    }
    this.visibleSidebar = false; // cerrar el sidebar al navegar
  }

  //Método para manejar errores de carga de imagen
  handleImageError(event: any) {
    this.imageError = true;
  }

  //Método para obtener las iniciales del usuario
  getUserInitials(): string {
    if (!this.nameUser) return 'U';
    const names = this.nameUser.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }

  //Método para navegar a un gráfico específico en el dashboard
  navigateToChart(chartId: string): void {
    // Cerrar el sidebar primero
    this.visibleSidebar = false;

    // Determinar la ruta del dashboard según el tipo de usuario
    const dashboardRoute = this.isAdmin ? '/admin/dashboard' : '/user/dashboard';

    // Verificar si ya estamos en el dashboard correspondiente
    if (this.router.url === dashboardRoute) {
      // Si ya estamos en el dashboard, hacer scroll directamente
      this.scrollToElement(chartId);
    } else {
      // Si no estamos en el dashboard, navegar primero
      this.router.navigate([dashboardRoute]).then(() => {
        this.scrollToElement(chartId);
      });
    }
  }

  //Método auxiliar para hacer scroll a un elemento
  private scrollToElement(elementId: string): void {
    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element) {
        // Calcular la altura real del navbar sticky
        const navbar = document.querySelector('.custom-toolbar') as HTMLElement;
        const navbarHeight = navbar ? navbar.offsetHeight : 100;
        const navbarOffset = navbarHeight + 20; // Altura del navbar + margen extra

        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - navbarOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      } else {
        console.warn(`Elemento con ID '${elementId}' no encontrado`);
      }
    }, 300); // Tiempo reducido para mejor UX
  }


  //Métodos privado que retorna un array de MenuItem[] con los ítems del menú para admin o user

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
      ]
    },

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

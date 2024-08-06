import { Component, Input, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';




@Component({
  selector: 'app-sidebar-admin',
  templateUrl: './sidebar-admin.component.html',
  styleUrls: ['./sidebar-admin.component.css']
})
export class SidebarAdminComponent implements OnInit {

  display!: boolean;
  visibleSidebar: boolean = true;
  itemsPanelMenu: MenuItem[] = [];

  @Input() nameUser!: string

  constructor() { }

  ngOnInit(): void {

    this.itemsPanelMenu = [


      {
        label: 'Reporte Egresado LinkedIn',
        icon: 'pi pi-linkedin',
        routerLink: '/admin/dashboard',

      },
      {
        label: 'Usuarios',
        icon: 'pi pi-users',
        items: [
          {
            label: 'Usuarios activos',
            icon: 'pi pi-fw pi-users',
            routerLink: '/admin/view-users',
          },
          {
            label: 'Usuarios eliminados',
            icon: 'pi pi-fw pi-trash',
            routerLink: '/admin/view-deleted-users',
          },
        ]
      },
      {
        label: 'Encuestas',
        icon: 'pi pi-book',
        items: [
          {
            label: 'Listado Encuestas',
            icon: 'pi pi-fw pi-bookmark-fill',
            routerLink: '/admin/view-encuesta',
          },
          {
            label: 'Crear encuesta',
            icon: 'pi pi-fw pi-bookmark',
            routerLink: '/admin/create-encuesta',
          },

        ]
      }
    ]
  }

}

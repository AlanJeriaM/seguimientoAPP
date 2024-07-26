import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { PrimeNGConfig } from 'primeng/api';
import { PanelMenu } from 'primeng/panelmenu';

@Component({
    selector: 'app-sidebar-user',
    templateUrl: './sidebar-user.component.html',
    styleUrls: ['./sidebar-user.component.css']
})
export class SidebarUserComponent implements OnInit {

    display!: boolean;
    itemsPanelMenu: MenuItem[] = [];

    @Input() nameUser!: string


    constructor(
        private primengConfig: PrimeNGConfig
    ) { }

    ngOnInit(): void {
        this.primengConfig.ripple = true;

        this.itemsPanelMenu = [
          {
            label: 'Reporte Egresado LinkedIn',
            icon: 'pi pi-linkedin',
            routerLink: '/user/dashboard',

          },
          {
            label: 'Encuestas',
            icon: 'pi pi-users',
            items: [
              {
                label: 'Encuestas nuevas',
                icon: 'pi pi-fw pi-users',
                routerLink: '/user/view-encuestas',
              },
              {
                label: 'Encuestas completadas',
                icon: 'pi pi-fw pi-trash',
                routerLink: '/user/encuesta-completada',
              },
            ]
          },
        ]
      }

    }


    // closeSidebar() {
    //     const offcanvas: HTMLElement | null = document.querySelector('#offcanvasExample');
    //     if (offcanvas) {
    //         offcanvas.classList.remove('show'); // cierra el sidebar
    //         // this.panelMenu.hide(); // oculta el menú desplegable (si está abierto)
    //     }
    // }


import { Component, Input, OnInit, } from '@angular/core';
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
    visibleSidebar: boolean = true;
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
                label: 'Encuesta nueva',
                icon: 'pi pi-file-edit',
                routerLink: '/user/view-encuestas',
              },
              {
                label: 'Encuestas completadas',
                icon: 'pi pi-check',
                routerLink: '/user/encuesta-completada',
              },
            ]
          },
        ]
      }

      toggleSidebar() {
        this.visibleSidebar = !this.visibleSidebar;
      }

    }



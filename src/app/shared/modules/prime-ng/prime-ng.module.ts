import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// PrimeNg Modules
import { ButtonModule } from 'primeng/button';
import { MenubarModule } from 'primeng/menubar';
import { SidebarModule } from 'primeng/sidebar';
import { PanelMenuModule } from 'primeng/panelmenu';
import { CardModule, } from 'primeng/card';
import { CalendarModule } from 'primeng/calendar';
import { FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { ToggleButtonModule } from 'primeng/togglebutton';
// import { PaginatorModule } from 'primeng/paginator';




const primeNgModules = [
  CommonModule,
  ButtonModule,
  MenubarModule,
  SidebarModule,
  PanelMenuModule,
  CardModule,
  CalendarModule,
  FileUploadModule,
  InputTextModule,
  InputTextareaModule,
  InputNumberModule,
  InputSwitchModule,
  ToastModule,
  RippleModule,
  ToggleButtonModule
  // PaginatorModule
]

@NgModule({
  imports: [
    CommonModule,
    ...primeNgModules
  ],
  exports: [
    ...primeNgModules
  ],
})
export class PrimeNgModule { }

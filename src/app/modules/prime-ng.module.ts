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
import { BadgeModule } from 'primeng/badge';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { ChartModule } from 'primeng/chart';
import { CheckboxModule } from 'primeng/checkbox';
import { PasswordModule } from 'primeng/password';


//de pruebas
import { DropdownModule } from 'primeng/dropdown';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { PaginatorModule } from 'primeng/paginator';
import { FieldsetModule } from 'primeng/fieldset';
import { MessageModule } from 'primeng/message';
import { RadioButtonModule } from 'primeng/radiobutton';

import { AccordionModule } from 'primeng/accordion';
import { MultiSelectModule } from 'primeng/multiselect';
import { RatingModule } from 'primeng/rating';
import { TagModule } from 'primeng/tag';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DialogModule } from 'primeng/dialog';
import { ToolbarModule } from 'primeng/toolbar';
import { TabViewModule } from 'primeng/tabview';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ProgressBarModule } from 'primeng/progressbar';
import { SliderModule } from 'primeng/slider';
import { DividerModule } from 'primeng/divider';
import { StepsModule } from 'primeng/steps';
import { ScrollTopModule } from 'primeng/scrolltop';
import { SkeletonModule } from 'primeng/skeleton';



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
  ToggleButtonModule,
  BadgeModule,
  RippleModule,
  MenuModule,
  AvatarModule,
  TieredMenuModule,
  ChartModule,
  CheckboxModule,
  PasswordModule,
  AccordionModule,
  MultiSelectModule,
  RatingModule,

  // de pruebas
  DropdownModule,
  ProgressSpinnerModule,
  TableModule,
  PaginatorModule,
  FieldsetModule,
  MessageModule,
  RadioButtonModule,
  TagModule,
  SelectButtonModule,
  DialogModule,
  ToolbarModule,
  TabViewModule,
  ConfirmDialogModule,
  OverlayPanelModule,
  ProgressBarModule,
  SliderModule,
  DividerModule,
  StepsModule,
  ScrollTopModule,
  SkeletonModule

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

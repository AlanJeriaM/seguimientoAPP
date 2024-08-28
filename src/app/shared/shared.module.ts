import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '../modules/prime-ng.module';
import { FooterComponent } from './components/footer/footer.component';
import { Error404PageComponent } from './pages/error404-page/error404-page.component';



@NgModule({
  declarations: [
    FooterComponent,
    Error404PageComponent
  ],
  imports: [
    CommonModule,
    PrimeNgModule,
  ],
  exports: [
    FooterComponent,

  ]
})
export class SharedModule { }

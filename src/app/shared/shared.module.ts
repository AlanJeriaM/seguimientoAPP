import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from './modules/prime-ng/prime-ng.module';
import { FooterComponent } from './components/footer/footer.component';



@NgModule({
  declarations: [
    FooterComponent
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

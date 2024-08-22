import { Component } from '@angular/core';

@Component({
  selector: 'app-shared-footer',
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {

  public customDate: Date = new Date();

}

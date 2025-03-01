import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-shared-dashboard',
  templateUrl: './shared-dashboard.component.html',
  styleUrl: './shared-dashboard.component.css'
})
export class SharedDashboardComponent implements OnInit {

  chartData: any;
  chartOptions: any;

  ngOnInit() {

  }

  constructor() { }

}

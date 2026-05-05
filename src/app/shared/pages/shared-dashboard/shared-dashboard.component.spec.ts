import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MessageService } from 'primeng/api';

import { SharedDashboardComponent } from './shared-dashboard.component';

describe('SharedDashboardComponent', () => {
  let component: SharedDashboardComponent;
  let fixture: ComponentFixture<SharedDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SharedDashboardComponent],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [MessageService],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SharedDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

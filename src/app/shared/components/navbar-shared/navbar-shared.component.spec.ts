import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MessageService } from 'primeng/api';

import { NavbarSharedComponent } from './navbar-shared.component';

describe('NavbarSharedComponent', () => {
  let component: NavbarSharedComponent;
  let fixture: ComponentFixture<NavbarSharedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NavbarSharedComponent],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [MessageService],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavbarSharedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

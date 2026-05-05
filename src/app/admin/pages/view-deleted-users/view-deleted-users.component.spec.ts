import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MessageService } from 'primeng/api';

import { ViewDeletedUsersComponent } from './view-deleted-users.component';

describe('ViewDeletedUsersComponent', () => {
  let component: ViewDeletedUsersComponent;
  let fixture: ComponentFixture<ViewDeletedUsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ViewDeletedUsersComponent],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [MessageService],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewDeletedUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

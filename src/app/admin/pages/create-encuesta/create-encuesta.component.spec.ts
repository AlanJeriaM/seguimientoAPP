import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MessageService } from 'primeng/api';

import { CreateEncuestaComponent } from './create-encuesta.component';

describe('CreateEncuestaComponent', () => {
  let component: CreateEncuestaComponent;
  let fixture: ComponentFixture<CreateEncuestaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateEncuestaComponent],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        ReactiveFormsModule
      ],
      providers: [MessageService],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateEncuestaComponent);
    component = fixture.componentInstance;
    // Sin detectChanges() aquí
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

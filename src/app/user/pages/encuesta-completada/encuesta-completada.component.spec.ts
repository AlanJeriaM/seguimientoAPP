import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { EncuestaCompletadaComponent } from './encuesta-completada.component';

describe('EncuestaCompletadaComponent', () => {
  let component: EncuestaCompletadaComponent;
  let fixture: ComponentFixture<EncuestaCompletadaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EncuestaCompletadaComponent],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [
        MessageService,
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ id: 1 }),
            queryParams: of({ token: 'test' }),
            snapshot: {
              params: { id: 1 },
              queryParams: { token: 'test' },
              paramMap: { get: (key: string) => '1' },
              queryParamMap: { get: (key: string) => 'test' }
            }
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EncuestaCompletadaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

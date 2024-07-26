import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EncuestaCompletadaComponent } from './encuesta-completada.component';

describe('EncuestaCompletadaComponent', () => {
  let component: EncuestaCompletadaComponent;
  let fixture: ComponentFixture<EncuestaCompletadaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EncuestaCompletadaComponent]
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

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewEncuestasComponent } from './view-encuestas.component';

describe('ViewEncuestasComponent', () => {
  let component: ViewEncuestasComponent;
  let fixture: ComponentFixture<ViewEncuestasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ViewEncuestasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewEncuestasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

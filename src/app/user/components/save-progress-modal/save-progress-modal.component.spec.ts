import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaveProgressModalComponent } from './save-progress-modal.component';

describe('SaveProgressModalComponent', () => {
  let component: SaveProgressModalComponent;
  let fixture: ComponentFixture<SaveProgressModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SaveProgressModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SaveProgressModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

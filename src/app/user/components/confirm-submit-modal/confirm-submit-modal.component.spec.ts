import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmSubmitModalComponent } from './confirm-submit-modal.component';

describe('ConfirmSubmitModalComponent', () => {
  let component: ConfirmSubmitModalComponent;
  let fixture: ComponentFixture<ConfirmSubmitModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConfirmSubmitModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmSubmitModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

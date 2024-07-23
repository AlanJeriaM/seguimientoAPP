import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewDeletedUsersComponent } from './view-deleted-users.component';

describe('ViewDeletedUsersComponent', () => {
  let component: ViewDeletedUsersComponent;
  let fixture: ComponentFixture<ViewDeletedUsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ViewDeletedUsersComponent]
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

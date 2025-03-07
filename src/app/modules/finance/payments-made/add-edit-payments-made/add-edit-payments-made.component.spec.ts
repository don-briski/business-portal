import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditPaymentsMadeComponent } from './add-edit-payments-made.component';

describe('AddEditPaymentsMadeComponent', () => {
  let component: AddEditPaymentsMadeComponent;
  let fixture: ComponentFixture<AddEditPaymentsMadeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddEditPaymentsMadeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddEditPaymentsMadeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

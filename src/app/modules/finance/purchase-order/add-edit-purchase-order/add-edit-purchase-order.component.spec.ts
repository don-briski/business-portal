import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditPurchaseOrderComponent } from './add-edit-purchase-order.component';

describe('AddEditPurchaseOrderComponent', () => {
  let component: AddEditPurchaseOrderComponent;
  let fixture: ComponentFixture<AddEditPurchaseOrderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddEditPurchaseOrderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddEditPurchaseOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

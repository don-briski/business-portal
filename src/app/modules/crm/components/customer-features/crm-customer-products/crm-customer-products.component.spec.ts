import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrmCustomerProductsComponent } from './crm-customer-products.component';

describe('CrmCustomerProductsComponent', () => {
  let component: CrmCustomerProductsComponent;
  let fixture: ComponentFixture<CrmCustomerProductsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CrmCustomerProductsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrmCustomerProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

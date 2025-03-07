import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerBalancesComponent } from './customer-vendor-balances.component';

describe('CustomerBalancesComponent', () => {
  let component: CustomerBalancesComponent;
  let fixture: ComponentFixture<CustomerBalancesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomerBalancesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerBalancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

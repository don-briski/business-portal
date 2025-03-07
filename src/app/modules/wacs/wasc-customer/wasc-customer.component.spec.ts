import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WascCustomerComponent } from './wasc-customer.component';

describe('WascCustomerComponent', () => {
  let component: WascCustomerComponent;
  let fixture: ComponentFixture<WascCustomerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WascCustomerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WascCustomerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

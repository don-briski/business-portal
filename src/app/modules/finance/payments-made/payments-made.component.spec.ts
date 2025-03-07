import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentsMadeComponent } from './payments-made.component';

describe('PaymentsMadeComponent', () => {
  let component: PaymentsMadeComponent;
  let fixture: ComponentFixture<PaymentsMadeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PaymentsMadeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentsMadeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

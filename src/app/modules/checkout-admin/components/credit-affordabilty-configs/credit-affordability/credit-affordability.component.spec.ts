import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreditAffordabilityComponent } from './credit-affordability.component';

describe('CreditAffordabilityComponent', () => {
  let component: CreditAffordabilityComponent;
  let fixture: ComponentFixture<CreditAffordabilityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreditAffordabilityComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreditAffordabilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

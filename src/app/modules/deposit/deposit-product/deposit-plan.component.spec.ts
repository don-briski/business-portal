import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepositPlanComponent } from './deposit-plan.component';

describe('DepositPlanComponent', () => {
  let component: DepositPlanComponent;
  let fixture: ComponentFixture<DepositPlanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DepositPlanComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DepositPlanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

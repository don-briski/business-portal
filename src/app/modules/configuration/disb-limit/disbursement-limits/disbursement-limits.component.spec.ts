import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisbursementLimitsComponent } from './disbursement-limits.component';

describe('DisbursementLimitsComponent', () => {
  let component: DisbursementLimitsComponent;
  let fixture: ComponentFixture<DisbursementLimitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DisbursementLimitsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DisbursementLimitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

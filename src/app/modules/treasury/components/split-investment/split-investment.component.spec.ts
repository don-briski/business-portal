import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SplitInvestmentComponent } from './split-investment.component';

describe('SplitInvestmentComponent', () => {
  let component: SplitInvestmentComponent;
  let fixture: ComponentFixture<SplitInvestmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SplitInvestmentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SplitInvestmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

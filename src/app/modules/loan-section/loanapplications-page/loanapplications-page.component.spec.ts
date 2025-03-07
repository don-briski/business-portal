import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LoanapplicationsPageComponent } from './loanapplications-page.component';

describe('LoanapplicationsPageComponent', () => {
  let component: LoanapplicationsPageComponent;
  let fixture: ComponentFixture<LoanapplicationsPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LoanapplicationsPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoanapplicationsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

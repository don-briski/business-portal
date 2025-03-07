import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LoanoffersPageComponent } from './loanoffers-page.component';

describe('LoanoffersPageComponent', () => {
  let component: LoantypesPageComponent;
  let fixture: ComponentFixture<LoanoffersPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LoanoffersPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoanoffersPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

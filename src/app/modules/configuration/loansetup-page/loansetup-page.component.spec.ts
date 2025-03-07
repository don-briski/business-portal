import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LoansetupPageComponent } from './loansetup-page.component';

describe('LoansetupPageComponent', () => {
  let component: LoansetupPageComponent;
  let fixture: ComponentFixture<LoansetupPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LoansetupPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoansetupPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

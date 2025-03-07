import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewLoanDashboardComponent } from './new-loan-dashboard.component';

describe('NewLoanDashboardComponent', () => {
  let component: NewLoanDashboardComponent;
  let fixture: ComponentFixture<NewLoanDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewLoanDashboardComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewLoanDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

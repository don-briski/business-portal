import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LoanreasonsPageComponent } from './loanreasons-page.component';

describe('LoanreasonsPageComponent', () => {
  let component: LoanreasonsPageComponent;
  let fixture: ComponentFixture<LoanreasonsPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LoanreasonsPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoanreasonsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

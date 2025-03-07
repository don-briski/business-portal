import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FinancesetupPageComponent } from './financesetup-page.component';

describe('FinancesetupPageComponent', () => {
  let component: FinancesetupPageComponent;
  let fixture: ComponentFixture<FinancesetupPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FinancesetupPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FinancesetupPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

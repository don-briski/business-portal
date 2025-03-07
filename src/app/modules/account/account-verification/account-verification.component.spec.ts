import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AccountVerificationComponent } from './account-verification.component';

describe('AccountVerificationComponent', () => {
  let component: AccountVerificationComponent;
  let fixture: ComponentFixture<AccountVerificationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AccountVerificationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AccountVerificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

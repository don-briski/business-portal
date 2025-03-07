import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BankCheckComponent } from './bank-check.component';

describe('BankCheckComponent', () => {
  let component: BankCheckComponent;
  let fixture: ComponentFixture<BankCheckComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BankCheckComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BankCheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

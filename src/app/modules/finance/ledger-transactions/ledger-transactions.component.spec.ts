import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LedgerTransactionsComponent } from './ledger-transactions.component';

describe('LedgerTransactionsComponent', () => {
  let component: LedgerTransactionsComponent;
  let fixture: ComponentFixture<LedgerTransactionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LedgerTransactionsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LedgerTransactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

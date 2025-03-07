import { TestBed } from '@angular/core/testing';

import { LedgerTransactionService } from './ledger-transaction.service';

describe('LedgerTransactionService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: LedgerTransactionService = TestBed.get(LedgerTransactionService);
    expect(service).toBeTruthy();
  });
});

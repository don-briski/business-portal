import { TestBed } from '@angular/core/testing';

import { PettyCashTransactionService } from './petty-cash-transaction.service';

describe('PettyCashTransactionService', () => {
  let service: PettyCashTransactionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PettyCashTransactionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

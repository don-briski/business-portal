import { TestBed } from '@angular/core/testing';

import { DepositAccountService } from './depositaccount.service';

describe('DepositAccountService', () => {
  let service: DepositAccountService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DepositAccountService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

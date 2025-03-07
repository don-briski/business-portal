import { TestBed } from '@angular/core/testing';

import { ChartOfAccountService } from './chart-of-account.service';

describe('ChartOfAccountService', () => {
  let service: ChartOfAccountService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChartOfAccountService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

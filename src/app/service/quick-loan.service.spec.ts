import { TestBed } from '@angular/core/testing';

import { QuickLoanService } from './quick-loan.service';

describe('QuickLoanService', () => {
  let service: QuickLoanService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuickLoanService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

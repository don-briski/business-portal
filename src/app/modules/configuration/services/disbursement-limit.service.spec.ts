import { TestBed } from '@angular/core/testing';

import { DisbursementLimitService } from './disbursement-limit.service';

describe('DisbursementLimitService', () => {
  let service: DisbursementLimitService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DisbursementLimitService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { LoanMetricsService } from './loan-metrics.service';

describe('LoanMetricsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: LoanMetricsService = TestBed.get(LoanMetricsService);
    expect(service).toBeTruthy();
  });
});

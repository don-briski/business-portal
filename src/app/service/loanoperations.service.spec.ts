import { TestBed } from '@angular/core/testing';

import { LoanoperationsService } from './loanoperations.service';

describe('LoanoperationsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: LoanoperationsService = TestBed.get(LoanoperationsService);
    expect(service).toBeTruthy();
  });
});

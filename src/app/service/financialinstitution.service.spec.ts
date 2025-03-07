import { TestBed } from '@angular/core/testing';

import { FinancialInstitutionService } from './financialinstitution.service';

describe('FinancialInstitutionService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: FinancialInstitutionService = TestBed.get(FinancialInstitutionService);
    expect(service).toBeTruthy();
  });
});

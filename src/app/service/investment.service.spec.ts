/* tslint:disable:no-unused-variable */

import { TestBed, inject, waitForAsync } from '@angular/core/testing';
import { InvestmentService } from './investment.service';

describe('Service: Investment', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InvestmentService]
    });
  });

  it('should ...', inject([InvestmentService], (service: InvestmentService) => {
    expect(service).toBeTruthy();
  }));
});

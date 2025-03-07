import { TestBed } from '@angular/core/testing';

import { CheckoutAdminService } from './checkout-admin.service';

describe('CheckoutAdminService', () => {
  let service: CheckoutAdminService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CheckoutAdminService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

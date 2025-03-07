import { TestBed } from '@angular/core/testing';

import { EnterpriseStyleService } from './enterprise-style.service';

describe('EnterpriseStyleService', () => {
  let service: EnterpriseStyleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnterpriseStyleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

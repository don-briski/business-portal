import { TestBed } from '@angular/core/testing';

import { VendorMgtService } from './vendor-mgt.service';

describe('VendorMgtService', () => {
  let service: VendorMgtService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VendorMgtService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

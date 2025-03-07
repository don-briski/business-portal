import { TestBed } from '@angular/core/testing';

import { WacsService } from './wacs.service';

describe('WacsService', () => {
  let service: WacsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WacsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

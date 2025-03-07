import { TestBed } from '@angular/core/testing';

import { WrappedService } from './wrapped.service';

describe('WrappedService', () => {
  let service: WrappedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WrappedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

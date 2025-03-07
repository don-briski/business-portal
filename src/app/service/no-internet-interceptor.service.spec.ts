import { TestBed } from '@angular/core/testing';

import { NoInternetInterceptorService } from './no-internet-interceptor.service';

describe('NoInternetInterceptorService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: NoInternetInterceptorService = TestBed.get(NoInternetInterceptorService);
    expect(service).toBeTruthy();
  });
});

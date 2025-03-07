import { TestBed } from '@angular/core/testing';

import { GrowthbookService } from './growthbook.service';

describe('GrowthbookService', () => {
  let service: GrowthbookService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GrowthbookService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

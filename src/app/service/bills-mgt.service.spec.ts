import { TestBed } from '@angular/core/testing';

import { BillsMgtService } from './bills-mgt.service';

describe('BillsMgtService', () => {
  let service: BillsMgtService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BillsMgtService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

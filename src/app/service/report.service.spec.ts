/* tslint:disable:no-unused-variable */

import { TestBed, inject, waitForAsync } from '@angular/core/testing';
import { ReportService } from './report.service';

describe('Service: Report', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ReportService]
    });
  });

  it('should ...', inject([ReportService], (service: ReportService) => {
    expect(service).toBeTruthy();
  }));
});

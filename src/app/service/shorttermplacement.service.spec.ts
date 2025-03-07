/* tslint:disable:no-unused-variable */

import { TestBed, inject, waitForAsync } from '@angular/core/testing';
import { ShortTermPlacementService } from './shorttermplacement.service';

describe('Service: ShortTermPlacement', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ShortTermPlacementService]
    });
  });

  it('should ...', inject([ShortTermPlacementService], (service: ShortTermPlacementService) => {
    expect(service).toBeTruthy();
  }));
});
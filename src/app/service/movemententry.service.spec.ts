import { TestBed } from '@angular/core/testing';

import { MovementEntryService } from './movemententry.service';

describe('MovementEntrySetupService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MovementEntryService = TestBed.get(MovementEntryService);
    expect(service).toBeTruthy();
  });
});

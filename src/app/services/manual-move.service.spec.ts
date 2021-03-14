import { TestBed } from '@angular/core/testing';

import { ManualMoveService } from './manual-move.service';

describe('ManualMoveService', () => {
  let service: ManualMoveService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ManualMoveService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

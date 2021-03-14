import { TestBed } from '@angular/core/testing';

import { ManoeuvreService } from './manoeuvre.service';

describe('ManoeuvreService', () => {
  let service: ManoeuvreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ManoeuvreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

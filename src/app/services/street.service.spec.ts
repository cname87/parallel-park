import { TestBed } from '@angular/core/testing';

import { StreetService } from './street.service';
import { ConfigService } from './config.service';

class MockConfigService {}

describe('StreetService', () => {
  let service: StreetService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      // provide the component-under-test and dependent service
      providers: [{ provide: ConfigService, useClass: MockConfigService }],
    }).compileComponents();
    service = TestBed.inject(StreetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

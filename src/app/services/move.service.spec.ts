import { TestBed } from '@angular/core/testing';

import { MoveService } from './move.service';
import { ConfigService } from './config.service';

class MockConfigService {}

describe('MoveService', () => {
  let service: MoveService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      // provide the component-under-test and dependent service
      providers: [{ provide: ConfigService, useClass: MockConfigService }],
    }).compileComponents();
    service = TestBed.inject(MoveService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

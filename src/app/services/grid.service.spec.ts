import { TestBed } from '@angular/core/testing';

import { GridService } from './grid.service';
import { ConfigService } from './config.service';

class MockConfigService {}

describe('GridService', () => {
  let service: GridService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      // provide the component-under-test and dependent service
      providers: [{ provide: ConfigService, useClass: MockConfigService }],
    }).compileComponents();
    service = TestBed.inject(GridService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

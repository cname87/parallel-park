import { TestBed } from '@angular/core/testing';

import { CalculationService } from './calculation.service';
import { ConfigService } from './config.service';

class MockConfigService {}

describe('CalculationService', () => {
  let service: CalculationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      // provide the component-under-test and dependent service
      providers: [{ provide: ConfigService, useClass: MockConfigService }],
    }).compileComponents();
    service = TestBed.inject(CalculationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

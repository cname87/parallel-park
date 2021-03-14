import { TestBed } from '@angular/core/testing';

import { CarService } from './car.service';
import { ConfigService } from './config.service';

class MockConfigService {}

describe('CarService', () => {
  let service: CarService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      // provide the component-under-test and dependent service
      providers: [{ provide: ConfigService, useClass: MockConfigService }],
    }).compileComponents();
    service = TestBed.inject(CarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

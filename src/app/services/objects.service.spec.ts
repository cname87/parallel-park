import { TestBed } from '@angular/core/testing';

import { ObjectsService } from './objects.service';
import { ConfigService } from './config.service';

class MockConfigService {}

describe('ObjectsService', () => {
  let service: ObjectsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      // provide the component-under-test and dependent service
      providers: [{ provide: ConfigService, useClass: MockConfigService }],
    }).compileComponents();
    service = TestBed.inject(ObjectsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

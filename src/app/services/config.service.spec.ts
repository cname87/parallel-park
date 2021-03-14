import { TestBed } from '@angular/core/testing';

import { ConfigService } from './config.service';

const mockDocument: any = {
  getElementById: () => {
    return null;
  },
};

describe('ConfigService', () => {
  let service: ConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConfigService, { provide: document, useValue: mockDocument }],
    });
    service = TestBed.inject(ConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

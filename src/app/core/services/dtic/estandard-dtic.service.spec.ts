import { TestBed } from '@angular/core/testing';

import { EstandardDticService } from './estandard-dtic.service';

describe('EstandardDticService', () => {
  let service: EstandardDticService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EstandardDticService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

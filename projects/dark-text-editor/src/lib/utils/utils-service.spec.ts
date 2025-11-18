import { TestBed } from '@angular/core/testing';

import { UtilsService } from './utils-service';
import { provideZonelessChangeDetection } from '@angular/core';

describe('UtilsService', () => {
  let service: UtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()]
    });
    service = TestBed.inject(UtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

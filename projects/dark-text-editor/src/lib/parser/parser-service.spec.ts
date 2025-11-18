import { TestBed } from '@angular/core/testing';

import { ParserService } from './parser-service';
import { provideZonelessChangeDetection } from '@angular/core';

describe('ParserService', () => {
  let service: ParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()]
    });
    service = TestBed.inject(ParserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

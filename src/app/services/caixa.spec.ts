import { TestBed } from '@angular/core/testing';

import { Caixa } from './caixa';

describe('Caixa', () => {
  let service: Caixa;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Caixa);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

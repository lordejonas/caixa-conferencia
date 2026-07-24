import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LivroCaixa } from './livro-caixa';

describe('LivroCaixa', () => {
  let component: LivroCaixa;
  let fixture: ComponentFixture<LivroCaixa>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LivroCaixa],
    }).compileComponents();

    fixture = TestBed.createComponent(LivroCaixa);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

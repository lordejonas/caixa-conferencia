import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LancamentosComponent } from './lancamentos.component';

describe('LancamentosComponent', () => {
  let component: LancamentosComponent;
  let fixture: ComponentFixture<LancamentosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LancamentosComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LancamentosComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

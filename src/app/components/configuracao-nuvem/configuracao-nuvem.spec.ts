import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfiguracaoNuvem } from './configuracao-nuvem';

describe('ConfiguracaoNuvem', () => {
  let component: ConfiguracaoNuvem;
  let fixture: ComponentFixture<ConfiguracaoNuvem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfiguracaoNuvem],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfiguracaoNuvem);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfiguracaoEntidadesComponent } from './configuracao-entidades.component';

describe('ConfiguracaoEntidadesComponent', () => {
  let component: ConfiguracaoEntidadesComponent;
  let fixture: ComponentFixture<ConfiguracaoEntidadesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfiguracaoEntidadesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfiguracaoEntidadesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

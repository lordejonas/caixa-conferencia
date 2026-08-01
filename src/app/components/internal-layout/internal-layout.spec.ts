import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InternalLayout } from './internal-layout';

describe('InternalLayout', () => {
  let component: InternalLayout;
  let fixture: ComponentFixture<InternalLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InternalLayout],
    }).compileComponents();

    fixture = TestBed.createComponent(InternalLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

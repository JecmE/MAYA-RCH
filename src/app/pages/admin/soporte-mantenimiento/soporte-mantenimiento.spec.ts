import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoporteMantenimiento } from './soporte-mantenimiento';

describe('SoporteMantenimiento', () => {
  let component: SoporteMantenimiento;
  let fixture: ComponentFixture<SoporteMantenimiento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SoporteMantenimiento],
    }).compileComponents();

    fixture = TestBed.createComponent(SoporteMantenimiento);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

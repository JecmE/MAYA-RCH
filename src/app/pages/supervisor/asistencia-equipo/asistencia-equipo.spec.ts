import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsistenciaEquipo } from './asistencia-equipo';

describe('AsistenciaEquipo', () => {
  let component: AsistenciaEquipo;
  let fixture: ComponentFixture<AsistenciaEquipo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsistenciaEquipo],
    }).compileComponents();

    fixture = TestBed.createComponent(AsistenciaEquipo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

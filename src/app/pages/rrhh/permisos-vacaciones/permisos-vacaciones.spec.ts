import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PermisosVacaciones } from './permisos-vacaciones';

describe('PermisosVacaciones', () => {
  let component: PermisosVacaciones;
  let fixture: ComponentFixture<PermisosVacaciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermisosVacaciones],
    }).compileComponents();

    fixture = TestBed.createComponent(PermisosVacaciones);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

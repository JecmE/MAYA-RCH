import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsistenciaGeneral } from './asistencia-general';

describe('AsistenciaGeneral', () => {
  let component: AsistenciaGeneral;
  let fixture: ComponentFixture<AsistenciaGeneral>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsistenciaGeneral],
    }).compileComponents();

    fixture = TestBed.createComponent(AsistenciaGeneral);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

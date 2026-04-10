import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KpiEquipo } from './kpi-equipo';

describe('KpiEquipo', () => {
  let component: KpiEquipo;
  let fixture: ComponentFixture<KpiEquipo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiEquipo],
    }).compileComponents();

    fixture = TestBed.createComponent(KpiEquipo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

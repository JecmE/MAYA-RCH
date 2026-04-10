import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditoriaFuncional } from './auditoria-funcional';

describe('AuditoriaFuncional', () => {
  let component: AuditoriaFuncional;
  let fixture: ComponentFixture<AuditoriaFuncional>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditoriaFuncional],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditoriaFuncional);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

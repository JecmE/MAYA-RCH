import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParametrosGlobales } from './parametros-globales';

describe('ParametrosGlobales', () => {
  let component: ParametrosGlobales;
  let fixture: ComponentFixture<ParametrosGlobales>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParametrosGlobales],
    }).compileComponents();

    fixture = TestBed.createComponent(ParametrosGlobales);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

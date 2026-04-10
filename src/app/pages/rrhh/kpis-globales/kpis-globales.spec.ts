import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KpisGlobales } from './kpis-globales';

describe('KpisGlobales', () => {
  let component: KpisGlobales;
  let fixture: ComponentFixture<KpisGlobales>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpisGlobales],
    }).compileComponents();

    fixture = TestBed.createComponent(KpisGlobales);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

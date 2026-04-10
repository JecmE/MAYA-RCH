import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BandejaPendientes } from './bandeja-pendientes';

describe('BandejaPendientes', () => {
  let component: BandejaPendientes;
  let fixture: ComponentFixture<BandejaPendientes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BandejaPendientes],
    }).compileComponents();

    fixture = TestBed.createComponent(BandejaPendientes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

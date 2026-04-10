import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Planilla } from './planilla';

describe('Planilla', () => {
  let component: Planilla;
  let fixture: ComponentFixture<Planilla>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Planilla],
    }).compileComponents();

    fixture = TestBed.createComponent(Planilla);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

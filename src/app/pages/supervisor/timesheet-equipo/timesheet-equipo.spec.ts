import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimesheetEquipo } from './timesheet-equipo';

describe('TimesheetEquipo', () => {
  let component: TimesheetEquipo;
  let fixture: ComponentFixture<TimesheetEquipo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimesheetEquipo],
    }).compileComponents();

    fixture = TestBed.createComponent(TimesheetEquipo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthlyHistory } from './monthly-history';

describe('MonthlyHistory', () => {
  let component: MonthlyHistory;
  let fixture: ComponentFixture<MonthlyHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonthlyHistory],
    }).compileComponents();

    fixture = TestBed.createComponent(MonthlyHistory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

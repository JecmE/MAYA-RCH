import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BonosIncentivos } from './bonos-incentivos';

describe('BonosIncentivos', () => {
  let component: BonosIncentivos;
  let fixture: ComponentFixture<BonosIncentivos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BonosIncentivos],
    }).compileComponents();

    fixture = TestBed.createComponent(BonosIncentivos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

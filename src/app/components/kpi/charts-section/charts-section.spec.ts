import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartsSection } from './charts-section';

describe('ChartsSection', () => {
  let component: ChartsSection;
  let fixture: ComponentFixture<ChartsSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartsSection],
    }).compileComponents();

    fixture = TestBed.createComponent(ChartsSection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

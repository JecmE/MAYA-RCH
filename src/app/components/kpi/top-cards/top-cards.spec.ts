import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopCards } from './top-cards';

describe('TopCards', () => {
  let component: TopCards;
  let fixture: ComponentFixture<TopCards>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopCards],
    }).compileComponents();

    fixture = TestBed.createComponent(TopCards);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

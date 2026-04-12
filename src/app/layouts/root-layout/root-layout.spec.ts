import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { RootLayout } from './root-layout';

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: () => 'empleado',
    setItem: () => {},
    removeItem: () => {},
  },
  writable: true,
});

describe('RootLayout', () => {
  let component: RootLayout;
  let fixture: ComponentFixture<RootLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RootLayout, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(RootLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

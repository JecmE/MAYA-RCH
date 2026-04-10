import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RolesPermisos } from './roles-permisos';

describe('RolesPermisos', () => {
  let component: RolesPermisos;
  let fixture: ComponentFixture<RolesPermisos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RolesPermisos],
    }).compileComponents();

    fixture = TestBed.createComponent(RolesPermisos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

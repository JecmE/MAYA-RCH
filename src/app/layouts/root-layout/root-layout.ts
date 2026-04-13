import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

type UserRole = 'empleado' | 'supervisor' | 'rrhh' | 'admin';

@Component({
  selector: 'app-root-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './root-layout.html',
  styleUrl: './root-layout.scss',
})
export class RootLayout {
  role: UserRole = 'empleado';

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    if (isPlatformBrowser(this.platformId)) {
      const storedRole = localStorage.getItem('userRole')?.toLowerCase();

      if (
        storedRole === 'empleado' ||
        storedRole === 'supervisor' ||
        storedRole === 'rrhh' ||
        storedRole === 'admin'
      ) {
        this.role = storedRole;
      }
    }
  }

  get isEmpleado(): boolean {
    return this.role === 'empleado';
  }

  get isSupervisor(): boolean {
    return this.role === 'supervisor';
  }

  get isRrhh(): boolean {
    return this.role === 'rrhh';
  }

  get isAdmin(): boolean {
    return this.role === 'admin';
  }

  get showEmpleadoMenu(): boolean {
    return this.isEmpleado || this.isSupervisor;
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('usuarioId');
      localStorage.removeItem('empleadoId');
    }
    this.router.navigate(['/login']);
  }
}

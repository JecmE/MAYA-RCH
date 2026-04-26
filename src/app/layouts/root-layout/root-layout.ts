import { Component, Inject, PLATFORM_ID, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { PermissionService } from '../../services/permission.service';

@Component({
  selector: 'app-root-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './root-layout.html',
  styleUrl: './root-layout.scss'
})
export class RootLayout implements OnInit, OnDestroy {
  role = 'empleado';
  roleDisplayName = 'Empleado';
  private permsSub?: Subscription;

  collapsedSections: { [key: string]: boolean } = {
    general: false,
    supervisor: false,
    rrhh: false,
    admin: false
  };

  constructor(
    private router: Router,
    private permissionService: PermissionService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.updateIdentity();

      // Suscribirse a cambios en los permisos para refrescar el menú lateral automáticamente
      this.permsSub = this.permissionService.permissions$.subscribe(() => {
        this.updateIdentity();
        this.cdr.detectChanges();
      });
    }
  }

  ngOnDestroy(): void {
    this.permsSub?.unsubscribe();
  }

  private updateIdentity(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.role = localStorage.getItem('userRole')?.toLowerCase() || 'empleado';
      this.roleDisplayName = localStorage.getItem('userRoleName') || 'Empleado';
    }
  }

  // MÉTODO PARA EL TEMPLATE: Verifica permisos dinámicamente con bypass de Admin
  canAccess(modulo: string): boolean {
    if (modulo === 'Dashboard' || modulo === 'Perfil') return true;
    if (this.role === 'admin' || this.role === 'administrador') return true;

    return this.permissionService.hasPermission(modulo, 'ver');
  }

  toggleSection(section: string): void {
    this.collapsedSections[section] = !this.collapsedSections[section];
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.clear();
      this.permissionService.clearPermissions();
    }
    this.router.navigate(['/login']);
  }
}

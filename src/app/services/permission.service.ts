import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { AdminService, PermisoItem } from './admin.service';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private permissionsSubject = new BehaviorSubject<PermisoItem[]>([]);
  public permissions$ = this.permissionsSubject.asObservable();
  private isBrowser: boolean;

  constructor(
    private adminService: AdminService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.loadStoredPermissions();
    }
  }

  loadPermissions(rolId: number): void {
    if (!rolId) return;
    this.adminService.getRolePermissions(rolId).subscribe({
      next: (perms) => {
        this.permissionsSubject.next(perms);
        if (this.isBrowser) {
          localStorage.setItem('user_permissions', JSON.stringify(perms));
          localStorage.setItem('user_rol_id', rolId.toString());
        }
      },
      error: (err) => {
        console.error('Error loading permissions:', err);
        this.permissionsSubject.next([]);
      }
    });
  }

  private loadStoredPermissions(): void {
    if (!this.isBrowser) return;
    const stored = localStorage.getItem('user_permissions');
    if (stored) {
      try {
        this.permissionsSubject.next(JSON.parse(stored));
      } catch (e) {
        this.permissionsSubject.next([]);
      }
    }
  }

  // MÉTODO MAESTRO: Verifica permisos con bypass para Administrador
  hasPermission(modulo: string, accion: 'ver' | 'crear' | 'editar' | 'aprobar' | 'exportar' | 'administrar' = 'ver'): boolean {
    if (!this.isBrowser) return false;

    // 1. EL ADMINISTRADOR SIEMPRE TIENE ACCESO TOTAL (Bypass de seguridad)
    const role = localStorage.getItem('userRole')?.toLowerCase();
    if (role === 'admin' || role === 'administrador') return true;

    // 2. Verificar en la matriz cargada
    const perms = this.permissionsSubject.value;
    if (!perms || perms.length === 0) return false;

    // Búsqueda insensible a mayúsculas/minúsculas
    const modPerm = perms.find(p => p.modulo.toLowerCase().trim() === modulo.toLowerCase().trim());

    // Si no encuentra el módulo, denegar por seguridad
    if (!modPerm) return false;

    return !!modPerm[accion];
  }

  clearPermissions(): void {
    this.permissionsSubject.next([]);
    if (this.isBrowser) {
      localStorage.removeItem('user_permissions');
      localStorage.removeItem('user_rol_id');
    }
  }
}

import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { UsersService, Empleado } from '../../services/users.service';
import { PermissionService } from '../../services/permission.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil implements OnInit, OnDestroy {
  private routerSubscription?: Subscription;
  telefono = '';

  passwordActual = '';
  nuevaPassword = '';
  confirmarPassword = '';

  showActual = false;
  showNueva = false;
  showConfirmar = false;

  successMessage = '';
  errorMessage = '';
  passwordSuccessMessage = '';
  passwordErrorMessage = '';

  showSuccessModal = false;
  showPasswordSuccessModal = false;
  isBrowser: boolean;
  forceChangeMode = false;

  perfilData: Empleado | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private usersService: UsersService,
    private permissionService: PermissionService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      const user = this.authService.getUserLocal();
      if (user?.requirePasswordChange) {
        this.forceChangeMode = true;
      }

      this.loadProfile();
      this.routerSubscription = this.router.events
        .pipe(filter((e) => e instanceof NavigationEnd))
        .subscribe((event) => {
          if ((event as NavigationEnd).urlAfterRedirects === '/perfil') {
            this.loadProfile();
          }
        });
    }
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  private sanitize(str: string | undefined | null): string {
    if (!str) return '';
    return str.replace(/\?/g, (match, offset, original) => {
      if (original.includes('Tecnolog')) return 'í';
      if (original.includes('Garc')) return 'í';
      return 'í';
    });
  }

  private loadProfile(): void {
    this.usersService.getMyProfile().subscribe({
      next: (data: Empleado) => {
        this.perfilData = {
          ...data,
          nombreCompleto: this.sanitize(data.nombreCompleto),
          departamento: this.sanitize(data.departamento),
          puesto: this.sanitize(data.puesto)
        };
        this.telefono = data.telefono || '';
        this.cdr.detectChanges();
      },
      error: () => {
        this.cdr.detectChanges();
      },
    });
  }

  goBack(): void {
    if (this.forceChangeMode) return;
    this.router.navigate(['/']);
  }

  guardarCambios(): void {
    this.errorMessage = '';
    this.successMessage = '';
    const telefonoLimpio = this.telefono.trim();
    if (!telefonoLimpio) {
      this.errorMessage = 'Ingresa un número de teléfono para actualizar.';
      return;
    }
    this.usersService.updateMyProfile({ telefono: telefonoLimpio }).subscribe({
      next: () => {
        this.showSuccessModal = true;
        this.loadProfile();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error al actualizar el teléfono.';
        this.cdr.detectChanges();
      },
    });
  }

  actualizarPassword(): void {
    this.passwordErrorMessage = '';
    const actual = this.passwordActual.trim();
    const nueva = this.nuevaPassword.trim();
    const confirmar = this.confirmarPassword.trim();

    if (!actual || !nueva || !confirmar) {
      this.passwordErrorMessage = 'Todos los campos son obligatorios.';
      return;
    }
    if (nueva.length < 8) {
      this.passwordErrorMessage = 'Mínimo 8 caracteres.';
      return;
    }
    if (nueva !== confirmar) {
      this.passwordErrorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    this.usersService.changePassword({ oldPassword: actual, newPassword: nueva }).subscribe({
      next: () => {
        this.showPasswordSuccessModal = true;
        this.passwordActual = '';
        this.nuevaPassword = '';
        this.confirmarPassword = '';
        // Si estaba en modo forzado, actualizar el token local para reflejar que ya no es obligatorio
        if (this.forceChangeMode) {
          const user = this.authService.getUserLocal();
          if (user) {
            user.requirePasswordChange = false;
            localStorage.setItem('user', JSON.stringify(user));
          }
          this.forceChangeMode = false;

          // Refrescar permisos para desbloquear el layout (sidebar)
          const rolId = localStorage.getItem('user_rol_id');
          if (rolId) {
            this.permissionService.loadPermissions(parseInt(rolId));
          }
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.passwordErrorMessage = err.error?.message || 'Error al actualizar. Verifica la clave actual.';
        this.cdr.detectChanges();
      }
    });
  }

  cerrarModalPerfil(): void { this.showSuccessModal = false; }
  cerrarModalPassword(): void { this.showPasswordSuccessModal = false; }
}

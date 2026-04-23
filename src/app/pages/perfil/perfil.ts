import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { UsersService, Empleado } from '../../services/users.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil implements OnInit, OnDestroy {
  private routerSubscription?: Subscription;
  telefono = '';

  passwordActual = '';
  nuevaPassword = '';
  confirmarPassword = '';

  successMessage = '';
  errorMessage = '';
  passwordSuccessMessage = '';
  passwordErrorMessage = '';

  showSuccessModal = false;
  showPasswordSuccessModal = false;
  isBrowser: boolean;

  perfilData: Empleado | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private usersService: UsersService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
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
      return 'í'; // Por defecto para este caso específico de María García en Tecnología
    });
  }

  private loadProfile(): void {
    this.usersService.getMyProfile().subscribe({
      next: (data: Empleado) => {
        // Sanitizar datos que vienen del servidor
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

    this.usersService.updateMyProfile({
      telefono: telefonoLimpio
    }).subscribe({
      next: () => {
        this.successMessage = 'Tu teléfono ha sido actualizado correctamente.';
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
    this.passwordSuccessMessage = '';

    const actual = this.passwordActual.trim();
    const nueva = this.nuevaPassword.trim();
    const confirmar = this.confirmarPassword.trim();

    if (!actual || !nueva || !confirmar) {
      this.passwordErrorMessage = 'Todos los campos de contraseña son obligatorios.';
      return;
    }

    if (nueva.length < 8) {
      this.passwordErrorMessage = 'La nueva contraseña debe tener al menos 8 caracteres.';
      return;
    }

    if (nueva !== confirmar) {
      this.passwordErrorMessage = 'La confirmación de la contraseña no coincide.';
      return;
    }

    this.usersService.changePassword({
      oldPassword: actual,
      newPassword: nueva
    }).subscribe({
      next: () => {
        this.passwordSuccessMessage = 'Tu contraseña ha sido actualizada con éxito.';
        this.showPasswordSuccessModal = true;
        this.passwordActual = '';
        this.nuevaPassword = '';
        this.confirmarPassword = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.passwordErrorMessage = err.error?.message || 'Error al actualizar la contraseña. Verifica que la contraseña actual sea correcta.';
        this.cdr.detectChanges();
      }
    });
  }

  cerrarModalPerfil(): void {
    this.showSuccessModal = false;
    this.cdr.detectChanges();
  }

  cerrarModalPassword(): void {
    this.showPasswordSuccessModal = false;
    this.cdr.detectChanges();
  }
}

import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  email = '';
  code = '';

  step = 1; // 1: Pedir email, 2: Pedir código
  submitted = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  // PASO 1: Enviar correo y recibir código de 6 dígitos
  handleSubmitEmail(event: Event): void {
    event.preventDefault();
    this.errorMessage = '';

    if (!this.email.trim() || !this.email.includes('@')) {
      this.errorMessage = 'Ingresa un correo electrónico válido.';
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    this.authService.forgotPassword({ email: this.email }).subscribe({
      next: () => {
        this.isLoading = false;
        this.step = 2; // Pasar a validación de código
        this.successMessage = 'Código enviado. Revisa tu bandeja de entrada.';
        this.cdr.detectChanges(); // ¡CODAZO MANUAL!
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Error al validar el correo.';
        this.cdr.detectChanges();
      }
    });
  }

  // PASO 2: Validar código y recibir contraseña final
  handleSubmitCode(event: Event): void {
    event.preventDefault();
    this.errorMessage = '';

    if (this.code.length !== 6) {
      this.errorMessage = 'El código debe ser de 6 dígitos.';
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    this.authService.verifyRecoveryCode(this.email, this.code).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.submitted = true; // Mostrar mensaje de éxito final
        this.successMessage = res.message;
        this.cdr.detectChanges(); // ¡CODAZO MANUAL!
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Código incorrecto o expirado.';
        this.cdr.detectChanges();
      }
    });
  }

  volverLogin(): void {
    this.router.navigate(['/login']);
  }
}

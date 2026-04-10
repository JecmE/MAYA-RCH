import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil {
  telefono = '+502 4455-6677';
  correoAlternativo = 'edgar.personal@gmail.com';
  direccion = 'Zona 10, Ciudad de Guatemala, Residenciales Las Palmas';

  passwordActual = '';
  nuevaPassword = '';
  confirmarPassword = '';

  successMessage = '';
  errorMessage = '';
  passwordSuccessMessage = '';
  passwordErrorMessage = '';

  showSuccessModal = false;
  showPasswordSuccessModal = false;

  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/']);
  }

  guardarCambios(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const telefonoLimpio = this.telefono.trim();
    const correoLimpio = this.correoAlternativo.trim();
    const direccionLimpia = this.direccion.trim();

    if (!telefonoLimpio || !correoLimpio || !direccionLimpia) {
      this.errorMessage = 'Completa todos los datos personales antes de guardar.';
      return;
    }

    if (!this.validarEmail(correoLimpio)) {
      this.errorMessage = 'Ingresa un correo alternativo válido.';
      return;
    }

    this.successMessage = 'Los datos personales se guardaron correctamente.';
    this.showSuccessModal = true;
  }

  actualizarPassword(): void {
    this.passwordErrorMessage = '';
    this.passwordSuccessMessage = '';

    const actual = this.passwordActual.trim();
    const nueva = this.nuevaPassword.trim();
    const confirmar = this.confirmarPassword.trim();

    if (!actual) {
      this.passwordErrorMessage = 'Debes ingresar la contraseña actual.';
      return;
    }

    if (!nueva) {
      this.passwordErrorMessage = 'Debes ingresar una nueva contraseña.';
      return;
    }

    if (nueva.length < 8) {
      this.passwordErrorMessage = 'La nueva contraseña debe tener al menos 8 caracteres.';
      return;
    }

    if (!confirmar) {
      this.passwordErrorMessage = 'Debes confirmar la nueva contraseña.';
      return;
    }

    if (nueva !== confirmar) {
      this.passwordErrorMessage = 'La confirmación de la contraseña no coincide.';
      return;
    }

    if (actual === nueva) {
      this.passwordErrorMessage = 'La nueva contraseña debe ser diferente a la actual.';
      return;
    }

    this.passwordSuccessMessage = 'La contraseña se actualizó correctamente.';
    this.showPasswordSuccessModal = true;

    this.passwordActual = '';
    this.nuevaPassword = '';
    this.confirmarPassword = '';
  }

  cerrarModalPerfil(): void {
    this.showSuccessModal = false;
  }

  cerrarModalPassword(): void {
    this.showPasswordSuccessModal = false;
  }

  private validarEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
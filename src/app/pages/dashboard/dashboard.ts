import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

type MarcaEstado = 'Pendiente' | 'Entrada' | 'Completa';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  marcaEstado: MarcaEstado = 'Pendiente';
  role = 'empleado';

  time = '16:40 PM';
  date = 'Lunes, 20 de marzo de 2026';

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.role = localStorage.getItem('userRole') || 'empleado';
    }
  }

  getWelcomeName(): string {
    if (this.role === 'admin') return 'Administrador del Sistema';
    if (this.role === 'rrhh') return 'María Pérez';
    if (this.role === 'supervisor') return 'Ana López';
    return 'Edgar Estuardo García Cabrera';
  }

  marcarEntrada(): void {
    if (this.marcaEstado === 'Pendiente') {
      this.marcaEstado = 'Entrada';
    }
  }

  marcarSalida(): void {
    if (this.marcaEstado === 'Entrada') {
      this.marcaEstado = 'Completa';
    }
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('userRole');
    }
    this.router.navigate(['/login']);
  }
}
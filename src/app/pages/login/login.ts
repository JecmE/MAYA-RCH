import { Component, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  error = false;
  errorMessage = '';
  username = '';
  password = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  handleLogin(event: Event) {
    event.preventDefault();
    this.error = false;
    this.errorMessage = '';

    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: (response) => {
        this.authService.setToken(response.token);
        if (isPlatformBrowser(this.platformId)) {
          const roleMap: { [key: string]: string } = {
            administrador: 'admin',
            rrhh: 'rrhh',
            supervisor: 'supervisor',
            empleado: 'empleado',
          };
          const backendRole = response.user.roles[0]?.toLowerCase() || 'empleado';
          const mappedRole = roleMap[backendRole] || 'empleado';
          localStorage.setItem('userRole', mappedRole);
          localStorage.setItem('usuarioId', response.user.usuarioId.toString());
          localStorage.setItem('empleadoId', response.user.empleadoId.toString());
        }
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Login error detail:', err);
        this.error = true;

        // Extraer mensaje real del backend
        if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else if (err.status === 401) {
          this.errorMessage = 'Credenciales incorrectas o cuenta bloqueada.';
        } else {
          this.errorMessage = 'Error de conexión con el servidor.';
        }

        // Forzar a Angular a mostrar el error en pantalla
        this.cdr.detectChanges();
      },
    });
  }
}

import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
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
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  handleLogin(event: Event) {
    event.preventDefault();

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
        this.error = true;
        this.errorMessage = err.error?.message || 'Error de autenticación';
      },
    });
  }
}

import { Component, Inject, PLATFORM_ID, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { PermissionService } from '../../services/permission.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  error = false;
  errorMessage = '';
  username = '';
  password = '';

  constructor(
    private authService: AuthService,
    private permissionService: PermissionService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnInit(): void {
    // LIMPIEZA INICIAL: Si entramos al login, aseguramos que no haya basura de sesiones previas
    if (isPlatformBrowser(this.platformId)) {
        localStorage.clear();
        this.permissionService.clearPermissions();
    }

    // Si viene de una redirección por expiración, mostrar mensaje
    this.route.queryParams.subscribe(params => {
      if (params['expired'] === 'true') {
        this.error = true;
        this.errorMessage = 'Su sesión ha expirado por inactividad o vencimiento de token.';
        this.cdr.detectChanges();
      }
    });
  }

  handleLogin(event: Event) {
    event.preventDefault();
    this.error = false;
    this.errorMessage = '';

    // LIMPIEZA DE SEGURIDAD: Antes de intentar loguear, borramos todo rastro de sesiones previas
    if (isPlatformBrowser(this.platformId)) {
        localStorage.clear();
        this.permissionService.clearPermissions();
    }

    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: (response) => {
        this.authService.setToken(response.token);
        if (isPlatformBrowser(this.platformId)) {
          const roleMap: { [key: string]: string } = {
            administrador: 'admin',
            rrhh: 'rrhh',
            supervisor: 'supervisor',
            empleado: 'empleado',
            auditor: 'auditor'
          };

          const rawRole = response.user.roles[0] || 'Empleado';
          const backendRoleKey = rawRole.toLowerCase();
          const mappedRole = roleMap[backendRoleKey] || 'empleado';

          localStorage.setItem('userRole', mappedRole);
          localStorage.setItem('userRoleName', rawRole);
          localStorage.setItem('usuarioId', response.user.usuarioId.toString());
          localStorage.setItem('empleadoId', response.user.empleadoId.toString());
          localStorage.setItem('user', JSON.stringify(response.user));

          // CARGAR PERMISOS: Solo si el rolId viene del backend
          if (response.user.rolId) {
            this.permissionService.loadPermissions(response.user.rolId);
          }

          if (response.user.requirePasswordChange) {
            this.router.navigate(['/perfil']);
            return;
          }
        }
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Login error detail:', err);
        this.error = true;
        this.errorMessage = err.error?.message || 'Credenciales incorrectas o error de servidor.';
        this.cdr.detectChanges();
      },
    });
  }
}

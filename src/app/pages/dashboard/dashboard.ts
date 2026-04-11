import { Component, Inject, PLATFORM_ID, OnInit, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AttendanceService } from '../../services/attendance.service';
import { KpiService, KpiDashboard } from '../../services/kpi.service';
import { LeavesService } from '../../services/leaves.service';

type MarcaEstado = 'Pendiente' | 'Entrada' | 'Completa';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  marcaEstado: MarcaEstado = 'Pendiente';
  role = 'empleado';
  userName = '';

  time = '';
  date = '';

  horaEntradaReal = '';
  horaSalidaReal = '';
  turnoNombre = '';
  toleranciaMinutos = 0;
  horaEntradaTurno = '';
  horaSalidaTurno = '';

  tardiasMes = 0;
  horasTrabajadas = 0;
  permisosPendientes = 0;
  cumplimiento = 0;
  clasificacion = '';

  private isCheckingIn = false;
  private isCheckingOut = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private attendanceService: AttendanceService,
    private kpiService: KpiService,
    private leavesService: LeavesService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.role = localStorage.getItem('userRole') || 'empleado';
    }
  }

  ngOnInit(): void {
    this.updateDateTime();
    this.loadUserProfile();
    this.loadTodayStatus();
    this.loadKpiData();
    setInterval(() => this.updateDateTime(), 60000);
  }

  private updateDateTime(): void {
    const now = new Date();
    this.time = now.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    this.date = now.toLocaleDateString('es-GT', options);
  }

  private loadUserProfile(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user: any) => {
        this.userName = user.nombreCompleto || user.username || '';
      },
      error: () => {
        this.userName = '';
      },
    });
  }

  private loadTodayStatus(): void {
    this.attendanceService.getTodayStatus().subscribe({
      next: (status: any) => {
        if (status.tieneEntrada && status.tieneSalida) {
          this.marcaEstado = 'Completa';
        } else if (status.tieneEntrada) {
          this.marcaEstado = 'Entrada';
        } else {
          this.marcaEstado = 'Pendiente';
        }
        this.horaEntradaReal = status.horaEntradaReal
          ? this.formatTime(status.horaEntradaReal)
          : '--:--';
        this.horaSalidaReal = status.horaSalidaReal
          ? this.formatTime(status.horaSalidaReal)
          : '--:--';
        this.turnoNombre = status.turnoNombre || 'Sin turno';
        this.toleranciaMinutos = status.toleranciaMinutos || 0;
        this.horaEntradaTurno = status.horaEntradaTurno || '';
        this.horaSalidaTurno = status.horaSalidaTurno || '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.marcaEstado = 'Pendiente';
        this.turnoNombre = 'Sin turno';
        this.toleranciaMinutos = 0;
        this.horaEntradaReal = '--:--';
        this.horaSalidaReal = '--:--';
        this.cdr.detectChanges();
      },
    });
  }

  private loadKpiData(): void {
    this.kpiService.getEmployeeDashboard().subscribe({
      next: (kpi: KpiDashboard) => {
        this.tardiasMes = kpi.tardias || 0;
        this.horasTrabajadas = kpi.horasTrabajadas || 0;
        this.cumplimiento = kpi.cumplimientoPct || 0;
        this.clasificacion = kpi.clasificacion || 'N/A';
        this.cdr.detectChanges();
      },
      error: () => {},
    });

    this.leavesService.getMyRequests().subscribe({
      next: (requests: any[]) => {
        this.permisosPendientes = requests.filter((r) => r.estado === 'pendiente').length;
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  private formatTime(time: string): string {
    if (!time) return '--:--';
    if (time.includes('T')) {
      return new Date(time).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
    }
    return time.substring(0, 5);
  }

  formatShiftTime(time: string): string {
    if (!time) return '--:--';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'p. m.' : 'a. m.';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
  }

  getWelcomeName(): string {
    if (this.userName) return this.userName;
    if (this.role === 'admin') return 'Administrador del Sistema';
    if (this.role === 'rrhh') return 'Usuario RRHH';
    if (this.role === 'supervisor') return 'Supervisor';
    return 'Empleado';
  }

  marcarEntrada(): void {
    if (this.isCheckingIn) return;
    this.isCheckingIn = true;

    this.attendanceService.checkIn().subscribe({
      next: (response: any) => {
        this.marcaEstado = 'Entrada';
        if (response.asistencia?.horaEntradaReal) {
          this.horaEntradaReal = this.formatTime(response.asistencia.horaEntradaReal);
        }
        this.isCheckingIn = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isCheckingIn = false;
        this.cdr.detectChanges();
      },
    });
  }

  marcarSalida(): void {
    if (this.isCheckingOut) return;
    this.isCheckingOut = true;

    this.attendanceService.checkOut().subscribe({
      next: (response: any) => {
        this.marcaEstado = 'Completa';
        if (response.asistencia?.horaSalidaReal) {
          this.horaSalidaReal = this.formatTime(response.asistencia.horaSalidaReal);
        }
        this.isCheckingOut = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isCheckingOut = false;
        this.cdr.detectChanges();
      },
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      complete: () => {
        this.authService.clearToken();
        if (isPlatformBrowser(this.platformId)) {
          localStorage.removeItem('userRole');
          localStorage.removeItem('usuarioId');
          localStorage.removeItem('empleadoId');
        }
        this.router.navigate(['/login']);
      },
      error: () => {
        this.authService.clearToken();
        if (isPlatformBrowser(this.platformId)) {
          localStorage.removeItem('userRole');
          localStorage.removeItem('usuarioId');
          localStorage.removeItem('empleadoId');
        }
        this.router.navigate(['/login']);
      },
    });
  }
}

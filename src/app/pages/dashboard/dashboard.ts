import {
  Component,
  Inject,
  PLATFORM_ID,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { AttendanceService } from '../../services/attendance.service';
import { KpiService, KpiDashboard } from '../../services/kpi.service';
import { LeavesService } from '../../services/leaves.service';
import { AdminService } from '../../services/admin.service';
import { NoticesService, Aviso } from '../../services/notices.service';

type MarcaEstado = 'Pendiente' | 'Entrada' | 'Completa';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  private routerSubscription?: Subscription;
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

  marcaError = '';
  marcaSuccess = '';

  canCheckIn = false;
  canCheckOut = false;
  checkInDisabledReason = '';
  checkOutDisabledReason = '';

  tardiasMes = 0;
  horasTrabajadas = 0;
  permisosPendientes = 0;
  cumplimiento = 0;
  clasificacion = '';

  adminStats: any = {};
  rrhhStats: any = {};
  supervisorStats: any = {};

  notices: any[] = [];

  private isCheckingIn = false;
  private isCheckingOut = false;
  private esDiaLaboral = true;

  constructor(
    private router: Router,
    private authService: AuthService,
    private attendanceService: AttendanceService,
    private kpiService: KpiService,
    private leavesService: LeavesService,
    private adminService: AdminService,
    private noticesService: NoticesService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.role = localStorage.getItem('userRole') || 'empleado';
    }
  }

  ngOnInit(): void {
    this.loadAllData();
    this.routerSubscription = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((event) => {
        if (
          (event as NavigationEnd).urlAfterRedirects === '/' ||
          (event as NavigationEnd).urlAfterRedirects === ''
        ) {
          this.loadAllData();
        }
      });

    // Actualizar reloj y disponibilidad cada 5 segundos para que sea reactivo
    setInterval(() => {
      this.updateDateTime();
      if (this.marcaEstado === 'Pendiente') {
        this.calculateCheckInAvailability();
      } else if (this.marcaEstado === 'Entrada') {
        this.calculateCheckOutAvailability();
      }
      this.cdr.detectChanges();
    }, 5000);
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  private loadAllData(): void {
    this.updateDateTime();
    this.loadUserProfile();
    this.loadTodayStatus();
    this.loadKpiData();
    this.loadDashboardStats();
    this.loadNotices();
  }

  private loadNotices(): void {
    this.noticesService.getMyNotices().subscribe({
      next: (dbNotices) => {
        this.notices = dbNotices.map(n => ({
          id: n.avisoId,
          title: n.titulo,
          text: n.mensaje,
          icon: this.getIconByType(n.tipo),
          color: this.getColorByType(n.tipo),
          persistent: true
        }));
        this.addDynamicNotices();
        this.cdr.detectChanges();
      }
    });
  }

  private getIconByType(type: string): string {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  }

  private getColorByType(type: string): string {
    switch (type) {
      case 'success': return 'green';
      case 'error': return 'red';
      case 'warning': return 'amber';
      default: return 'blue';
    }
  }

  private addDynamicNotices(): void {
    if (this.marcaEstado === 'Entrada') {
      this.notices.push({
        title: 'Recordatorio de marcaje',
        text: 'No olvides registrar tu salida al finalizar tu jornada.',
        icon: '⏰',
        color: 'blue'
      });
    }

    if (this.cumplimiento < 85 && this.cumplimiento > 0) {
      this.notices.push({
        title: 'Actualización de KPIs',
        text: 'Tu rendimiento actual está por debajo de la meta. ¡Tú puedes mejorar!',
        icon: '📊',
        color: 'amber'
      });
    }

    if (this.role === 'rrhh') {
      if (this.rrhhStats.permisosPendientes > 0) {
        this.notices.push({ title: 'Solicitudes en espera', text: `Hay ${this.rrhhStats.permisosPendientes} solicitudes pendientes de revisión.`, icon: '📝', color: 'blue' });
      }
      if (this.rrhhStats.empleadosEnRiesgo > 0) {
        this.notices.push({ title: 'Alerta de Desempeño', text: `Se detectaron ${this.rrhhStats.empleadosEnRiesgo} empleados con bajo rendimiento.`, icon: '⚠️', color: 'red' });
      }
    }
  }

  eliminarAviso(notice: any): void {
    const noticeId = notice.id;
    if (notice.persistent && noticeId) {
      this.noticesService.deleteNotice(noticeId).subscribe(() => {
        this.notices = this.notices.filter(n => n !== notice);
        this.cdr.detectChanges();
      });
    } else {
      this.notices = this.notices.filter(n => n !== notice);
      this.cdr.detectChanges();
    }
  }

  limpiarTodo(): void {
    this.noticesService.clearAll().subscribe(() => {
      this.notices = this.notices.filter(n => !n.persistent);
      this.cdr.detectChanges();
    });
  }

  private loadDashboardStats(): void {
    if (this.role === 'admin') {
      this.adminService.getAdminDashboardStats().subscribe({
        next: (stats) => {
          this.adminStats = stats;
          this.cdr.detectChanges();
        },
        error: () => {},
      });
    } else if (this.role === 'rrhh') {
      this.adminService.getRrhhDashboardStats().subscribe({
        next: (stats) => {
          this.rrhhStats = stats;
          this.cdr.detectChanges();
        },
        error: () => {},
      });
    } else if (this.role === 'supervisor') {
      this.adminService.getSupervisorDashboardStats().subscribe({
        next: (stats) => {
          this.supervisorStats = stats;
          this.cdr.detectChanges();
        },
        error: () => {},
      });
    }
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
        this.userName = this.sanitizeName(user.nombreCompleto || user.username || '');
      },
      error: () => {
        this.userName = '';
      },
    });
  }

  private sanitizeName(name: string): string {
    if (!name) return '';
    const words = name.split(' ');
    const seen = new Set<string>();
    return words.filter(w => {
      const normalized = w.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (seen.has(normalized) && w.length > 2) return false;
      seen.add(normalized);
      return true;
    }).join(' ');
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

        if (status.estadoJornada === 'no_laboral') {
          this.esDiaLaboral = false;
          this.canCheckIn = false;
          this.checkInDisabledReason = status.mensajeEstado || 'Hoy no es un día laborable para tu turno.';
        } else {
          this.esDiaLaboral = true;
          if (!status.tieneEntrada && !status.tieneSalida) {
            this.calculateCheckInAvailability();
            this.canCheckOut = false;
            this.checkOutDisabledReason = '';
          } else if (status.tieneEntrada && !status.tieneSalida) {
            this.canCheckIn = false;
            this.checkInDisabledReason = '';
            this.calculateCheckOutAvailability();
          } else {
            this.canCheckIn = false;
            this.checkOutDisabledReason = '';
          }
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.marcaEstado = 'Pendiente';
        this.turnoNombre = 'Sin turno';
        this.toleranciaMinutos = 0;
        this.horaEntradaReal = '--:--';
        this.horaSalidaReal = '--:--';
        this.canCheckIn = false;
        this.canCheckOut = false;
        this.cdr.detectChanges();
      },
    });
  }

  private calculateCheckInAvailability(): void {
    const now = new Date();
    this.canCheckIn = false;
    this.checkInDisabledReason = '';

    if (!this.esDiaLaboral) {
      this.checkInDisabledReason = 'Hoy no es un día laborable para tu turno.';
      return;
    }

    if (!this.horaEntradaTurno) {
      this.checkInDisabledReason = 'No tienes turno asignado. Contacta a tu supervisor.';
      return;
    }

    const [h, m, s] = this.horaEntradaTurno.split(':').map(Number);
    const horaEntradaEsperada = new Date(now);
    horaEntradaEsperada.setHours(h, m, s || 0, 0);

    const horaEntradaMin = new Date(horaEntradaEsperada);
    horaEntradaMin.setMinutes(horaEntradaMin.getMinutes() - 30);

    const horaEntradaMax = new Date(horaEntradaEsperada);
    horaEntradaMax.setMinutes(horaEntradaMax.getMinutes() + this.toleranciaMinutos);

    if (now < horaEntradaMin) {
      const horaHabilitacion = this.formatShiftTime(this.getFormattedTime(horaEntradaMin));
      this.checkInDisabledReason = `Podrás marcar entrada a partir de las ${horaHabilitacion}`;
    } else if (now > horaEntradaMax) {
      const horaLimite = this.formatShiftTime(this.getFormattedTime(horaEntradaMax));
      this.checkInDisabledReason = `Límite excedido (${horaLimite}). Contacta a tu supervisor.`;
    } else {
      this.canCheckIn = true;
    }
  }

  private calculateCheckOutAvailability(): void {
    const now = new Date();
    this.canCheckOut = false;
    this.checkOutDisabledReason = '';

    if (!this.horaSalidaTurno || !this.horaEntradaTurno) {
      this.checkOutDisabledReason = 'No tienes turno asignado. Contacta a tu supervisor.';
      return;
    }

    const [hSal, mSal, sSal] = this.horaSalidaTurno.split(':').map(Number);
    const [hEnt, mEnt] = this.horaEntradaTurno.split(':').map(Number);

    let horaSalidaEsperada = new Date(now);
    horaSalidaEsperada.setHours(hSal, mSal, sSal || 0, 0);

    if (this.isNocturnalShift()) {
      if (now.getHours() >= hEnt) {
        horaSalidaEsperada.setDate(horaSalidaEsperada.getDate() + 1);
      }
    }

    if (now < horaSalidaEsperada) {
      this.checkOutDisabledReason = `Podrás marcar salida a partir de las ${this.formatShiftTime(this.horaSalidaTurno)}${this.isNocturnalShift() && now.getHours() >= hEnt ? ' (Mañana)' : ''}.`;
    } else {
      this.canCheckOut = true;
    }
  }

  private getFormattedTime(date: Date): string {
    return date.toTimeString().substring(0, 8);
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

  isNocturnalShift(): boolean {
    if (!this.horaEntradaTurno || !this.horaSalidaTurno) return false;
    const [hEnt, mEnt] = this.horaEntradaTurno.split(':').map(Number);
    const [hSal, mSal] = this.horaSalidaTurno.split(':').map(Number);
    return hSal < hEnt || (hSal === hEnt && mSal < mEnt);
  }

  marcarEntrada(): void {
    if (this.isCheckingIn) return;
    this.isCheckingIn = true;
    this.marcaError = '';
    this.marcaSuccess = '';

    this.attendanceService.checkIn().subscribe({
      next: (response: any) => {
        this.marcaEstado = 'Entrada';
        if (response.asistencia?.horaEntradaReal) {
          this.horaEntradaReal = this.formatTime(response.asistencia.horaEntradaReal);
        }
        this.marcaSuccess = 'Entrada registrada correctamente';
        this.canCheckIn = false;
        this.checkInDisabledReason = '';
        this.calculateCheckOutAvailability();
        this.isCheckingIn = false;
        this.loadKpiData();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.marcaError = err.error?.message || 'Error al marcar entrada';
        this.isCheckingIn = false;
        this.cdr.detectChanges();
      },
    });
  }

  marcarSalida(): void {
    if (this.isCheckingOut) return;
    this.isCheckingOut = true;
    this.marcaError = '';
    this.marcaSuccess = '';

    this.attendanceService.checkOut().subscribe({
      next: (response: any) => {
        this.marcaEstado = 'Completa';
        if (response.asistencia?.horaSalidaReal) {
          this.horaSalidaReal = this.formatTime(response.asistencia.horaSalidaReal);
        }
        this.marcaSuccess = 'Salida registrada correctamente';
        this.canCheckIn = false;
        this.canCheckOut = false;
        this.isCheckingOut = false;
        this.loadKpiData();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.marcaError = err.error?.message || 'Error al marcar salida';
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

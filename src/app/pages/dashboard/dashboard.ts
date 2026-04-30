import {
  Component,
  Inject,
  PLATFORM_ID,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { AttendanceService } from '../../services/attendance.service';
import { KpiService, KpiDashboard } from '../../services/kpi.service';
import { LeavesService } from '../../services/leaves.service';
import { AdminService } from '../../services/admin.service';
import { NoticesService, Notice } from '../../services/notices.service';
import { PermissionService } from '../../services/permission.service';

type MarcaEstado = 'Pendiente' | 'Entrada' | 'Completa';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  private routerSubscription?: Subscription;
  private statsInterval?: any;
  private permsSub?: Subscription;

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
    private permissionService: PermissionService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
        this.role = localStorage.getItem('userRole') || 'empleado';
    }

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

    this.permsSub = this.permissionService.permissions$.subscribe(() => {
        this.cdr.detectChanges();
    });

    setInterval(() => {
      this.updateDateTime();
      if (this.marcaEstado === 'Pendiente') {
        this.calculateCheckInAvailability();
      } else if (this.marcaEstado === 'Entrada') {
        this.calculateCheckOutAvailability();
      }
      this.cdr.detectChanges();
    }, 5000);

    if (isPlatformBrowser(this.platformId) && this.role === 'admin') {
      this.loadDashboardStats();
      this.statsInterval = setInterval(() => {
        this.loadDashboardStats();
      }, 15000);
    }
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    this.permsSub?.unsubscribe();
    if (this.statsInterval) clearInterval(this.statsInterval);
  }

  getClassificationClass(): string {
    const c = this.clasificacion.toLowerCase();
    if (c.includes('excelente')) return 'text-green';
    if (c.includes('bueno')) return 'text-blue';
    if (c.includes('regular') || c.includes('observacion')) return 'text-amber';
    if (c.includes('riesgo')) return 'text-red';
    return '';
  }

  canAccess(modulo: string): boolean {
    if (this.role === 'admin' || this.role === 'administrador') return true;
    return this.permissionService.hasPermission(modulo, 'ver');
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
    this.notices = this.notices.filter(n => n.persistent);

    if (this.marcaEstado === 'Entrada') {
      this.notices.push({ title: 'Marcaje pendiente', text: 'Recuerda registrar tu salida al finalizar.', icon: '⏰', color: 'blue' });
    }

    if (this.role === 'admin') {
      if (this.adminStats.intentosFallidos > 0) {
        this.notices.push({
          title: 'Seguridad: Intentos Fallidos',
          text: `Se han detectado ${this.adminStats.intentosFallidos} intentos fallidos de acceso hoy.`,
          icon: '🛡️',
          color: 'red'
        });
      }
      if (this.adminStats.usuariosBloqueados > 0) {
        this.notices.push({
          title: 'Gestión de Cuentas',
          text: `Hay ${this.adminStats.usuariosBloqueados} cuentas suspendidas que requieren revisión.`,
          icon: '🔒',
          color: 'amber'
        });
      }
    }

    if (this.role === 'rrhh' && this.rrhhStats.permisosPendientes > 0) {
      this.notices.push({ title: 'Tareas de RRHH', text: `Tienes ${this.rrhhStats.permisosPendientes} solicitudes pendientes.`, icon: '📝', color: 'blue' });
    }
  }

  eliminarAviso(notice: any): void {
    const id = notice.id || notice.avisoId;
    if (notice.persistent && id) {
      this.noticesService.deleteNotice(id).subscribe(() => {
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
          this.addDynamicNotices();
          this.cdr.detectChanges();
        }
      });
    } else if (this.role === 'rrhh') {
      this.adminService.getRrhhDashboardStats().subscribe({
        next: (stats) => {
          this.rrhhStats = stats;
          this.addDynamicNotices();
          this.cdr.detectChanges();
        }
      });
    } else if (this.role === 'supervisor') {
      this.adminService.getSupervisorDashboardStats().subscribe({
        next: (stats) => {
          this.supervisorStats = stats;
          this.cdr.detectChanges();
        }
      });
    }
  }

  private updateDateTime(): void {
    const now = new Date();
    this.time = now.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    this.date = now.toLocaleDateString('es-GT', options);
  }

  private loadUserProfile(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user: any) => {
        this.userName = this.sanitizeName(user.nombreCompleto || user.username || '');
        this.cdr.detectChanges();
      }
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
        if (status.tieneEntrada && status.tieneSalida) this.marcaEstado = 'Completa';
        else if (status.tieneEntrada) this.marcaEstado = 'Entrada';
        else this.marcaEstado = 'Pendiente';

        this.horaEntradaReal = status.horaEntradaReal ? this.formatTime(status.horaEntradaReal) : '--:--';
        this.horaSalidaReal = status.horaSalidaReal ? this.formatTime(status.horaSalidaReal) : '--:--';
        this.turnoNombre = status.turnoNombre || 'Sin turno';
        this.toleranciaMinutos = status.toleranciaMinutos || 0;
        this.horaEntradaTurno = status.horaEntradaTurno || '';
        this.horaSalidaTurno = status.horaSalidaTurno || '';

        if (status.estadoJornada === 'no_laboral') {
          this.esDiaLaboral = false;
          this.canCheckIn = false;
          this.canCheckOut = false;
          this.checkInDisabledReason = status.mensajeEstado || 'Hoy no es un día laborable.';
        } else {
          this.esDiaLaboral = true;
          if (this.marcaEstado === 'Pendiente') { this.calculateCheckInAvailability(); this.canCheckOut = false; }
          else if (this.marcaEstado === 'Entrada') { this.canCheckIn = false; this.checkInDisabledReason = 'Entrada ya registrada.'; this.calculateCheckOutAvailability(); }
          else if (this.marcaEstado === 'Completa') { this.canCheckIn = false; this.canCheckOut = false; this.checkInDisabledReason = 'Jornada finalizada.'; this.checkOutDisabledReason = 'Salida ya registrada.'; }
        }
        this.cdr.detectChanges();
      }
    });
  }

  private calculateCheckInAvailability(): void {
    const now = new Date();
    this.canCheckIn = false;
    this.checkInDisabledReason = '';

    if (!this.esDiaLaboral) { this.checkInDisabledReason = 'Día no laborable.'; return; }
    if (!this.horaEntradaTurno) { this.checkInDisabledReason = 'Sin turno asignado.'; return; }

    const [h, m] = this.horaEntradaTurno.split(':').map(Number);
    const expected = new Date(now);
    expected.setHours(h, m, 0, 0);

    const minTime = new Date(expected); minTime.setHours(minTime.getHours() - 1);
    const maxTime = new Date(expected); maxTime.setMinutes(maxTime.getMinutes() + this.toleranciaMinutos);

    if (now < minTime) this.checkInDisabledReason = `Disponible desde las ${this.formatShiftTime(this.getFormattedTime(minTime))}`;
    else if (now > maxTime) this.checkInDisabledReason = `Límite excedido (${this.formatShiftTime(this.getFormattedTime(maxTime))})`;
    else this.canCheckIn = true;
  }

  private calculateCheckOutAvailability(): void {
    const now = new Date();
    this.canCheckOut = false;
    this.checkOutDisabledReason = '';

    if (!this.horaSalidaTurno) { this.checkOutDisabledReason = 'Sin turno asignado.'; return; }

    const [hSal, mSal] = this.horaSalidaTurno.split(':').map(Number);
    let expectedSal = new Date(now); expectedSal.setHours(hSal, mSal, 0, 0);

    if (this.isNocturnalShift() && now.getHours() >= Number(this.horaEntradaTurno.split(':')[0])) expectedSal.setDate(expectedSal.getDate() + 1);

    if (now < expectedSal) this.checkOutDisabledReason = `Salida disponible desde las ${this.formatShiftTime(this.horaSalidaTurno)}`;
    else this.canCheckOut = true;
  }

  private getFormattedTime(date: Date): string { return date.toTimeString().substring(0, 8); }

  private loadKpiData(): void {
    this.kpiService.getEmployeeDashboard().subscribe({
      next: (kpi: KpiDashboard) => {
        this.tardiasMes = kpi.tardias || 0;
        this.horasTrabajadas = kpi.horasTrabajadas || 0;
        this.cumplimiento = kpi.cumplimientoPct || 0;
        this.clasificacion = kpi.clasificacion || 'N/A';
        this.cdr.detectChanges();
      }
    });

    this.leavesService.getMyRequests().subscribe({
      next: (requests: any[]) => {
        this.permisosPendientes = requests.filter((r) => r.estado === 'pendiente').length;
        this.cdr.detectChanges();
      }
    });
  }

  private formatTime(time: string): string {
    if (!time) return '--:--';
    if (time.includes('T')) return new Date(time).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
    return time.substring(0, 5);
  }

  formatShiftTime(time: string): string {
    if (!time) return '--:--';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'p. m.' : 'a. m.';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
  }

  getWelcomeName(): string { return this.userName || 'Usuario'; }

  isNocturnalShift(): boolean {
    if (!this.horaEntradaTurno || !this.horaSalidaTurno) return false;
    const [hEnt] = this.horaEntradaTurno.split(':').map(Number);
    const [hSal] = this.horaSalidaTurno.split(':').map(Number);
    return hSal < hEnt;
  }

  marcarEntrada(): void {
    if (this.isCheckingIn) return;
    this.isCheckingIn = true; this.marcaError = ''; this.marcaSuccess = '';
    this.attendanceService.checkIn().subscribe({
      next: () => { this.marcaEstado = 'Entrada'; this.marcaSuccess = 'Entrada registrada'; this.loadTodayStatus(); this.isCheckingIn = false; this.cdr.detectChanges(); },
      error: (err) => { this.marcaError = err.error?.message || 'Error'; this.isCheckingIn = false; this.cdr.detectChanges(); },
    });
  }

  marcarSalida(): void {
    if (this.isCheckingOut) return;
    this.isCheckingOut = true; this.marcaError = ''; this.marcaSuccess = '';
    this.attendanceService.checkOut().subscribe({
      next: () => { this.marcaEstado = 'Completa'; this.marcaSuccess = 'Salida registrada'; this.loadTodayStatus(); this.isCheckingOut = false; this.cdr.detectChanges(); },
      error: (err) => { this.marcaError = err.error?.message || 'Error'; this.isCheckingOut = false; this.cdr.detectChanges(); },
    });
  }

  logout(): void { if (isPlatformBrowser(this.platformId)) { localStorage.clear(); this.permissionService.clearPermissions(); } this.router.navigate(['/login']); }
}

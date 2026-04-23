import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { KpiService, SupervisorKpi, EmployeeProfile } from '../../../services/kpi.service';

interface ChartItem {
  name: string;
  kpi: number;
}

interface EquipoItem {
  id: number;
  empleado: string;
  kpi: string;
  kpiNum: number;
  clasificacion: string;
  tendencia: 'up' | 'down';
  alerta?: boolean;
  observacion?: string;
}

interface PeriodoData {
  chartData: ChartItem[];
  equipoData: EquipoItem[];
  comparacionMesAnterior: number;
  promedioEquipo: number;
}

interface PeriodoOption {
  label: string;
  mes: number;
  anio: number;
}

@Component({
  selector: 'app-kpi-equipo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kpi-equipo.html',
  styleUrl: './kpi-equipo.css',
})
export class KpiEquipo implements OnInit {
  isBrowser: boolean;
  modalPerfil = false;
  isLoadingProfile = false;

  empleadoSeleccionado: EquipoItem | null = null;
  empleadoProfileData: EmployeeProfile | null = null;

  periodosDisponibles: PeriodoOption[] = [];
  periodoSeleccionado: PeriodoOption | null = null;

  filtroBusqueda = '';
  filtroClasificacion = 'Todas las clasificaciones';

  observacionTemporal = '';
  observacionGuardadaMensaje = '';
  observacionError = '';
  isSavingObservation = false;

  dataActual: PeriodoData | null = null;

  constructor(
    private router: Router,
    private kpiService: KpiService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.generatePeriodOptions();
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadKpiData();
    }
  }

  private generatePeriodOptions(): void {
    const options: PeriodoOption[] = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      options.push({
        label: `${this.getMonthName(d.getMonth() + 1)} ${d.getFullYear()}`,
        mes: d.getMonth() + 1,
        anio: d.getFullYear()
      });
    }
    this.periodosDisponibles = options;
    this.periodoSeleccionado = options[0];
  }

  onPeriodChange(): void {
    this.loadKpiData();
  }

  loadKpiData(): void {
    if (!this.periodoSeleccionado) return;

    this.kpiService.getSupervisorDashboard(0, this.periodoSeleccionado.mes, this.periodoSeleccionado.anio).subscribe({
      next: (data: any) => {
        if (data && data.empleados) {
          this.dataActual = this.mapToPeriodoData(data);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.dataActual = null;
        this.cdr.detectChanges();
      },
    });
  }

  private mapToPeriodoData(data: any): PeriodoData {
    const employees: SupervisorKpi[] = data.empleados || [];

    const chartData: ChartItem[] = employees.map((k) => ({
      name: k.nombreCompleto?.split(' ')[0] || `ID ${k.empleadoId}`,
      kpi: k.cumplimientoPct,
    }));

    const equipoData: EquipoItem[] = employees.map((k) => ({
      id: k.empleadoId,
      empleado: k.nombreCompleto,
      kpi: `${k.cumplimientoPct}%`,
      kpiNum: k.cumplimientoPct,
      clasificacion: k.clasificacion || 'Sin datos',
      tendencia: k.cumplimientoPct >= 85 ? 'up' : 'down',
      alerta: k.cumplimientoPct < 70,
      observacion: '',
    }));

    return {
      chartData,
      equipoData,
      comparacionMesAnterior: data.resumen?.comparacionMesAnterior || 0,
      promedioEquipo: data.resumen?.promedioCumplimiento || 0
    };
  }

  private getMonthName(month: number): string {
    const names = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return names[month - 1] || '';
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  verPerfil(empleado: EquipoItem): void {
    this.empleadoSeleccionado = empleado;
    this.modalPerfil = true;
    this.isLoadingProfile = true;
    this.empleadoProfileData = null;
    this.observacionTemporal = '';
    this.observacionGuardadaMensaje = '';
    this.observacionError = '';

    this.kpiService.getEmployeeProfile(empleado.id).subscribe({
      next: (profile: EmployeeProfile) => {
        this.empleadoProfileData = profile;
        // @ts-ignore - Accedemos a la observación del KPI real cargado
        this.observacionTemporal = profile.kpiActual?.observacion || '';
        this.isLoadingProfile = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingProfile = false;
        this.cdr.detectChanges();
      },
    });
  }

  cerrarModal(): void {
    this.modalPerfil = false;
    this.empleadoSeleccionado = null;
    this.empleadoProfileData = null;
  }

  guardarObservacion(): void {
    if (!this.empleadoSeleccionado || !this.periodoSeleccionado || this.isSavingObservation) return;

    this.observacionGuardadaMensaje = '';
    this.observacionError = '';

    const texto = this.observacionTemporal.trim();
    if (!texto) {
      this.observacionError = 'Debes escribir una observación antes de guardarla.';
      return;
    }

    this.isSavingObservation = true;
    this.kpiService.saveObservation(
      this.empleadoSeleccionado.id,
      this.periodoSeleccionado.mes,
      this.periodoSeleccionado.anio,
      texto
    ).subscribe({
      next: () => {
        this.isSavingObservation = false;
        this.observacionGuardadaMensaje = 'La observación se guardó correctamente.';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isSavingObservation = false;
        this.observacionError = err.error?.message || 'Error al guardar la observación.';
        this.cdr.detectChanges();
      }
    });
  }

  get equipoFiltrado(): EquipoItem[] {
    if (!this.dataActual) return [];

    return this.dataActual.equipoData.filter((row) => {
      const coincideBusqueda =
        !this.filtroBusqueda.trim() ||
        row.empleado.toLowerCase().includes(this.filtroBusqueda.trim().toLowerCase());

      const coincideClasificacion =
        this.filtroClasificacion === 'Todas las clasificaciones' ||
        row.clasificacion === this.filtroClasificacion;

      return coincideBusqueda && coincideClasificacion;
    });
  }

  getInitials(nombre: string): string {
    if (!nombre) return '?';
    return nombre
      .split(' ')
      .filter(n => n.length > 0)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  getClasificacionClass(clasificacion: string): string {
    const c = (clasificacion || '').toLowerCase();
    if (c.includes('excelente')) return 'badge badge--excellent';
    if (c.includes('bueno')) return 'badge badge--good';
    if (c.includes('observacion')) return 'badge badge--regular';
    return 'badge badge--risk';
  }

  getBarClass(kpi: number): string {
    if (kpi >= 95) return 'bar--green';
    if (kpi >= 85) return 'bar--blue';
    if (kpi >= 70) return 'bar--amber';
    return 'bar--red';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const correctedDate = new Date(date.getTime() + userTimezoneOffset);

    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const day = days[correctedDate.getDay()];
    const dayNum = correctedDate.getDate().toString().padStart(2, '0');
    const month = (correctedDate.getMonth() + 1).toString().padStart(2, '0');
    return `${day} ${dayNum}/${month}`;
  }

  formatTime(timeStr: string): string {
    if (!timeStr) return '--:--';
    if (timeStr.includes('T') || timeStr.includes(':')) {
      // Si es formato ISO o tiene dos puntos, intentamos parsear
      let d: Date;
      if (timeStr.includes('T')) {
        d = new Date(timeStr);
      } else {
        const [h, m] = timeStr.split(':');
        d = new Date();
        d.setHours(parseInt(h), parseInt(m));
      }
      return d.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
    }
    return timeStr;
  }

  capitalize(str: string): string {
    if (!str) return '';
    const s = str.toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}

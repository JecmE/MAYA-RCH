import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
  clasificacion: 'Excelente' | 'Bueno' | 'Regular';
  tendencia: 'up' | 'down';
  alerta?: boolean;
  observacion?: string;
}

interface PeriodoData {
  chartData: ChartItem[];
  equipoData: EquipoItem[];
  comparacionMesAnterior?: number;
}

@Component({
  selector: 'app-kpi-equipo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kpi-equipo.html',
  styleUrl: './kpi-equipo.css',
})
export class KpiEquipo implements OnInit {
  modalPerfil = false;
  empleadoSeleccionado: EquipoItem | null = null;
  empleadoProfileData: EmployeeProfile | null = null;

  periodoSeleccionado = 'Marzo 2026';
  filtroBusqueda = '';
  filtroClasificacion = 'Todas las clasificaciones';

  observacionTemporal = '';
  observacionGuardadaMensaje = '';
  observacionError = '';

  periodos: Record<string, PeriodoData> = {};
  periodosDisponibles: string[] = [];

  constructor(
    private router: Router,
    private kpiService: KpiService,
  ) {}

  ngOnInit(): void {
    this.loadKpiData();
  }

  private loadKpiData(): void {
    const supervisorId = this.getSupervisorId();
    if (!supervisorId) {
      this.periodos = {};
      return;
    }

    const currentDate = new Date();
    this.periodoSeleccionado = `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getFullYear()}`;
    this.periodosDisponibles = [this.periodoSeleccionado];

    this.kpiService.getSupervisorDashboard(supervisorId).subscribe({
      next: (data: any) => {
        if (data && data.empleados) {
          this.periodos[this.periodoSeleccionado] = this.mapSupervisorKpiToPeriodoData(
            data.empleados,
          );
          this.periodos[this.periodoSeleccionado].comparacionMesAnterior =
            data.resumen?.comparacionMesAnterior || 0;
        }
      },
      error: () => {
        this.periodos = {};
      },
    });
  }

  private getSupervisorId(): number | null {
    const empleadoIdStr = localStorage.getItem('empleadoId');
    return empleadoIdStr ? parseInt(empleadoIdStr, 10) : null;
  }

  private mapSupervisorKpiToPeriodoData(data: SupervisorKpi[]): PeriodoData {
    const chartData: ChartItem[] = data.map((kpi) => ({
      name: kpi.nombreCompleto?.split(' ')[0] || `Emp ${kpi.empleadoId}`,
      kpi: kpi.cumplimientoPct,
    }));

    const equipoData: EquipoItem[] = data.map((kpi) => this.mapKpiToEquipoItem(kpi));

    return { chartData, equipoData };
  }

  private mapKpiToEquipoItem(kpi: SupervisorKpi): EquipoItem {
    let clasificacion: 'Excelente' | 'Bueno' | 'Regular' = 'Regular';
    if (kpi.cumplimientoPct >= 90) clasificacion = 'Excelente';
    else if (kpi.cumplimientoPct >= 80) clasificacion = 'Bueno';

    return {
      id: kpi.empleadoId,
      empleado: kpi.nombreCompleto || `Empleado ${kpi.empleadoId}`,
      kpi: `${kpi.cumplimientoPct}%`,
      clasificacion,
      tendencia: kpi.cumplimientoPct >= 90 ? 'up' : 'down',
      alerta: kpi.cumplimientoPct < 75,
      observacion: '',
    };
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  verPerfil(empleado: EquipoItem): void {
    this.empleadoSeleccionado = empleado;
    this.modalPerfil = true;
    this.observacionTemporal = empleado.observacion ?? '';
    this.observacionGuardadaMensaje = '';
    this.observacionError = '';
    this.empleadoProfileData = null;

    this.kpiService.getEmployeeProfile(empleado.id).subscribe({
      next: (profile: EmployeeProfile) => {
        this.empleadoProfileData = profile;
      },
      error: () => {
        this.empleadoProfileData = null;
      },
    });
  }

  cerrarModal(): void {
    this.modalPerfil = false;
    this.empleadoSeleccionado = null;
    this.empleadoProfileData = null;
    this.observacionTemporal = '';
    this.observacionGuardadaMensaje = '';
    this.observacionError = '';
  }

  guardarObservacion(): void {
    this.observacionGuardadaMensaje = '';
    this.observacionError = '';

    const texto = this.observacionTemporal.trim();

    if (!texto) {
      this.observacionError = 'Debes escribir una observación antes de guardarla.';
      return;
    }

    if (this.empleadoSeleccionado) {
      this.empleadoSeleccionado.observacion = texto;
      this.observacionGuardadaMensaje = 'La observación se guardó correctamente.';
    }
  }

  get chartData(): ChartItem[] {
    return this.periodos[this.periodoSeleccionado]?.chartData ?? [];
  }

  get equipoData(): EquipoItem[] {
    return this.periodos[this.periodoSeleccionado]?.equipoData ?? [];
  }

  get promedioEquipo(): string {
    if (!this.chartData.length) return '0.0';
    const total = this.chartData.reduce((sum, item) => sum + item.kpi, 0);
    return (total / this.chartData.length).toFixed(1);
  }

  get comparacionMesAnterior(): string {
    const val = this.periodos[this.periodoSeleccionado]?.comparacionMesAnterior ?? 0;
    const sign = val >= 0 ? '+' : '';
    return `${sign}${val}% vs mes anterior`;
  }

  get equipoFiltrado(): EquipoItem[] {
    return this.equipoData.filter((row) => {
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
    return nombre
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  getClasificacionClass(clasificacion: string): string {
    switch (clasificacion) {
      case 'Excelente':
        return 'badge badge--excellent';
      case 'Bueno':
        return 'badge badge--good';
      default:
        return 'badge badge--regular';
    }
  }

  getBarClass(kpi: number): string {
    if (kpi >= 90) return 'bar--green';
    if (kpi >= 80) return 'bar--blue';
    if (kpi >= 70) return 'bar--amber';
    return 'bar--red';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const day = days[date.getDay()];
    const dayNum = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day} ${dayNum}/${month}`;
  }

  formatTime(timeStr: string): string {
    if (!timeStr) return '--:--';
    if (timeStr.length >= 5) return timeStr.substring(0, 5);
    return timeStr;
  }
}

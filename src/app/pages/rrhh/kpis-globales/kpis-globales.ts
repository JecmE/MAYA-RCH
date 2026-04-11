import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { KpiService, HrKpi, EmployeeClassification } from '../../../services/kpi.service';

interface KpiGlobalItem {
  id: number;
  departamento: string;
  cumplimiento: string;
  tardias: number;
  faltas: number;
  clasificacion: string;
  periodo: string;
}

interface KpiDepartamentoChartItem {
  name: string;
  kpi: number;
  periodo: string;
}

interface KpiEquipoChartItem {
  name: string;
  kpi: number;
  periodo: string;
}

interface KpiClasificacionChartItem {
  name: string;
  cantidad: number;
  periodo: string;
}

interface KpiDetalleItem {
  id: number;
  empleado: string;
  depto: string;
  tardias: number;
  faltas: number;
  horas: string;
  cumplimiento: string;
  clasificacion: string;
  periodo: string;
}

@Component({
  selector: 'app-kpis-globales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kpis-globales.html',
  styleUrl: './kpis-globales.css',
})
export class KpisGlobales implements OnInit {
  periodoSeleccionado = 'Octubre 2023';
  filtroClasificacion = 'Todas las clasificaciones';
  filtroBusqueda = '';

  periodosDisponibles = ['Octubre 2023', 'Septiembre 2023'];

  resumenDepartamentos: KpiGlobalItem[] = [];
  deptoData: KpiDepartamentoChartItem[] = [];
  equipoData: KpiEquipoChartItem[] = [];
  clasificacionData: KpiClasificacionChartItem[] = [];
  tablaData: KpiDetalleItem[] = [];

  private hrKpi: HrKpi | null = null;

  constructor(
    private router: Router,
    private kpiService: KpiService,
  ) {}

  ngOnInit(): void {
    this.loadKpiData();
  }

  private loadKpiData(): void {
    this.kpiService.getHrDashboard().subscribe({
      next: (data: HrKpi) => {
        this.hrKpi = data;
        this.updateDepartamentosData(data);
        this.updateClasificacionData();
      },
      error: () => {
        this.hrKpi = null;
        this.resumenDepartamentos = [];
        this.clasificacionData = [];
      },
    });

    this.kpiService.getEmployeeClassifications().subscribe({
      next: (data: EmployeeClassification[]) => {
        this.tablaData = data.map((item, index) => this.mapClassificationToDetalle(item, index));
        this.deptoData = this.generateDeptoData(data);
        this.equipoData = this.generateEquipoData(data);
      },
      error: () => {
        this.tablaData = [];
        this.deptoData = [];
        this.equipoData = [];
      },
    });
  }

  private updateDepartamentosData(data: HrKpi): void {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    this.periodoSeleccionado = `${currentMonth} ${currentYear}`;

    this.periodosDisponibles = [this.periodoSeleccionado];

    this.resumenDepartamentos = [
      {
        id: 1,
        departamento: 'General',
        cumplimiento: `${data.promedioCumplimiento}%`,
        tardias: data.totalTardias,
        faltas: data.totalFaltas,
        clasificacion:
          data.promedioCumplimiento >= 90
            ? 'Excelente'
            : data.promedioCumplimiento >= 80
              ? 'Bueno'
              : 'Observación',
        periodo: this.periodoSeleccionado,
      },
    ];
  }

  private updateClasificacionData(): void {
    if (!this.hrKpi || !this.hrKpi.clasificaciones) return;

    const clasif = this.hrKpi.clasificaciones;

    this.clasificacionData = [
      { name: 'Excelente', cantidad: clasif.Excelente || 0, periodo: this.periodoSeleccionado },
      { name: 'Bueno', cantidad: clasif.Bueno || 0, periodo: this.periodoSeleccionado },
      {
        name: 'Regular',
        cantidad: clasif['En observacion'] || 0,
        periodo: this.periodoSeleccionado,
      },
      { name: 'Riesgo', cantidad: clasif['En riesgo'] || 0, periodo: this.periodoSeleccionado },
    ];
  }

  private mapClassificationToDetalle(item: EmployeeClassification, index: number): KpiDetalleItem {
    return {
      id: item.empleadoId,
      empleado: item.nombreCompleto || `Empleado ${item.empleadoId}`,
      depto: 'General',
      tardias: item.tardias ?? 0,
      faltas: item.faltas ?? 0,
      horas: '-',
      cumplimiento: `${item.cumplimientoPct}%`,
      clasificacion: item.clasificacion,
      periodo: this.periodoSeleccionado,
    };
  }

  private generateDeptoData(classifications: EmployeeClassification[]): KpiDepartamentoChartItem[] {
    return classifications.slice(0, 5).map((c) => ({
      name: c.nombreCompleto?.split(' ')[0] || `Emp ${c.empleadoId}`,
      kpi: c.cumplimientoPct,
      periodo: this.periodoSeleccionado,
    }));
  }

  private generateEquipoData(classifications: EmployeeClassification[]): KpiEquipoChartItem[] {
    return classifications.slice(0, 4).map((c, i) => ({
      name: `Equipo ${String.fromCharCode(65 + i)}`,
      kpi: c.cumplimientoPct,
      periodo: this.periodoSeleccionado,
    }));
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  aplicarFiltros(): void {
    this.filtroBusqueda = '';
    this.filtroClasificacion = 'Todas las clasificaciones';
  }

  get resumenDepartamentosFiltrado(): KpiGlobalItem[] {
    return this.resumenDepartamentos.filter((item) => item.periodo === this.periodoSeleccionado);
  }

  get deptoDataFiltrado(): KpiDepartamentoChartItem[] {
    return this.deptoData.filter((item) => item.periodo === this.periodoSeleccionado);
  }

  get equipoDataFiltrado(): KpiEquipoChartItem[] {
    return this.equipoData.filter((item) => item.periodo === this.periodoSeleccionado);
  }

  get clasificacionDataFiltrado(): KpiClasificacionChartItem[] {
    return this.clasificacionData.filter((item) => item.periodo === this.periodoSeleccionado);
  }

  get detalleFiltrado(): KpiDetalleItem[] {
    const texto = this.filtroBusqueda.trim().toLowerCase();

    return this.tablaData.filter((item) => {
      const coincidePeriodo = item.periodo === this.periodoSeleccionado;

      const coincideBusqueda =
        !texto ||
        item.empleado.toLowerCase().includes(texto) ||
        item.depto.toLowerCase().includes(texto) ||
        item.clasificacion.toLowerCase().includes(texto);

      const coincideClasificacion =
        this.filtroClasificacion === 'Todas las clasificaciones' ||
        item.clasificacion === this.filtroClasificacion;

      return coincidePeriodo && coincideBusqueda && coincideClasificacion;
    });
  }

  get cumplimientoPromedio(): string {
    if (this.hrKpi) {
      return `${this.hrKpi.promedioCumplimiento}%`;
    }
    const data = this.deptoDataFiltrado;
    if (!data.length) return '0%';

    const promedio = data.reduce((acc, item) => acc + item.kpi, 0) / data.length;
    return `${promedio.toFixed(1)}%`;
  }

  get tardiasMes(): number {
    if (this.hrKpi) return this.hrKpi.totalTardias;
    return this.detalleFiltrado.reduce((acc, item) => acc + item.tardias, 0);
  }

  get faltasMes(): number {
    if (this.hrKpi) return this.hrKpi.totalFaltas;
    return this.detalleFiltrado.reduce((acc, item) => acc + item.faltas, 0);
  }

  get empleadosEnRiesgo(): number {
    return this.detalleFiltrado.filter(
      (item) => item.clasificacion === 'Riesgo' || item.clasificacion === 'Riesgo Moderado',
    ).length;
  }

  getClasificacionClass(clasificacion: string): string {
    if (clasificacion === 'Excelente') return 'status-badge--excellent';
    if (clasificacion === 'Bueno') return 'status-badge--good';
    if (clasificacion === 'Observación' || clasificacion === 'Regular')
      return 'status-badge--warning';
    return 'status-badge--risk';
  }

  getBarHeight(valor: number): number {
    return Math.max(18, valor);
  }

  getClasificacionBarClass(nombre: string): string {
    if (nombre === 'Excelente') return 'chart-bar chart-bar--excellent';
    if (nombre === 'Bueno') return 'chart-bar chart-bar--good';
    if (nombre === 'Regular') return 'chart-bar chart-bar--warning';
    return 'chart-bar chart-bar--risk';
  }
}

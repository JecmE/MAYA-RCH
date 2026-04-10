import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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
export class KpisGlobales {
  periodoSeleccionado = 'Octubre 2023';
  filtroClasificacion = 'Todas las clasificaciones';
  filtroBusqueda = '';

  periodosDisponibles = ['Octubre 2023', 'Septiembre 2023'];

  resumenDepartamentos: KpiGlobalItem[] = [
    { id: 1, departamento: 'RRHH', cumplimiento: '94%', tardias: 2, faltas: 0, clasificacion: 'Excelente', periodo: 'Octubre 2023' },
    { id: 2, departamento: 'Operaciones', cumplimiento: '87%', tardias: 5, faltas: 1, clasificacion: 'Bueno', periodo: 'Octubre 2023' },
    { id: 3, departamento: 'Tecnología', cumplimiento: '79%', tardias: 7, faltas: 2, clasificacion: 'Observación', periodo: 'Octubre 2023' },
    { id: 4, departamento: 'Finanzas', cumplimiento: '68%', tardias: 8, faltas: 3, clasificacion: 'Riesgo', periodo: 'Octubre 2023' },

    { id: 5, departamento: 'RRHH', cumplimiento: '92%', tardias: 3, faltas: 0, clasificacion: 'Excelente', periodo: 'Septiembre 2023' },
    { id: 6, departamento: 'Operaciones', cumplimiento: '84%', tardias: 6, faltas: 1, clasificacion: 'Bueno', periodo: 'Septiembre 2023' },
    { id: 7, departamento: 'Tecnología', cumplimiento: '76%', tardias: 8, faltas: 2, clasificacion: 'Observación', periodo: 'Septiembre 2023' },
    { id: 8, departamento: 'Finanzas', cumplimiento: '65%', tardias: 9, faltas: 4, clasificacion: 'Riesgo', periodo: 'Septiembre 2023' }
  ];

  deptoData: KpiDepartamentoChartItem[] = [
    { name: 'Tecnología', kpi: 95, periodo: 'Octubre 2023' },
    { name: 'Marketing', kpi: 88, periodo: 'Octubre 2023' },
    { name: 'Ventas', kpi: 82, periodo: 'Octubre 2023' },
    { name: 'RRHH', kpi: 97, periodo: 'Octubre 2023' },
    { name: 'Finanzas', kpi: 91, periodo: 'Octubre 2023' },

    { name: 'Tecnología', kpi: 91, periodo: 'Septiembre 2023' },
    { name: 'Marketing', kpi: 84, periodo: 'Septiembre 2023' },
    { name: 'Ventas', kpi: 79, periodo: 'Septiembre 2023' },
    { name: 'RRHH', kpi: 94, periodo: 'Septiembre 2023' },
    { name: 'Finanzas', kpi: 88, periodo: 'Septiembre 2023' }
  ];

  equipoData: KpiEquipoChartItem[] = [
    { name: 'Equipo A', kpi: 93, periodo: 'Octubre 2023' },
    { name: 'Equipo B', kpi: 87, periodo: 'Octubre 2023' },
    { name: 'Equipo C', kpi: 91, periodo: 'Octubre 2023' },
    { name: 'Equipo D', kpi: 85, periodo: 'Octubre 2023' },

    { name: 'Equipo A', kpi: 90, periodo: 'Septiembre 2023' },
    { name: 'Equipo B', kpi: 84, periodo: 'Septiembre 2023' },
    { name: 'Equipo C', kpi: 88, periodo: 'Septiembre 2023' },
    { name: 'Equipo D', kpi: 81, periodo: 'Septiembre 2023' }
  ];

  clasificacionData: KpiClasificacionChartItem[] = [
    { name: 'Excelente', cantidad: 85, periodo: 'Octubre 2023' },
    { name: 'Bueno', cantidad: 42, periodo: 'Octubre 2023' },
    { name: 'Regular', cantidad: 15, periodo: 'Octubre 2023' },
    { name: 'Riesgo', cantidad: 8, periodo: 'Octubre 2023' },

    { name: 'Excelente', cantidad: 76, periodo: 'Septiembre 2023' },
    { name: 'Bueno', cantidad: 39, periodo: 'Septiembre 2023' },
    { name: 'Regular', cantidad: 18, periodo: 'Septiembre 2023' },
    { name: 'Riesgo', cantidad: 12, periodo: 'Septiembre 2023' }
  ];

  tablaData: KpiDetalleItem[] = [
    { id: 1, empleado: 'Carlos Mérida', depto: 'Tecnología', tardias: 0, faltas: 0, horas: '160h', cumplimiento: '100%', clasificacion: 'Excelente', periodo: 'Octubre 2023' },
    { id: 2, empleado: 'Lucía Torres', depto: 'Ventas', tardias: 4, faltas: 1, horas: '152h', cumplimiento: '85%', clasificacion: 'Riesgo Moderado', periodo: 'Octubre 2023' },
    { id: 3, empleado: 'Ana Gómez', depto: 'Marketing', tardias: 1, faltas: 0, horas: '160h', cumplimiento: '98%', clasificacion: 'Bueno', periodo: 'Octubre 2023' },

    { id: 4, empleado: 'Mario Paz', depto: 'Finanzas', tardias: 3, faltas: 1, horas: '154h', cumplimiento: '88%', clasificacion: 'Bueno', periodo: 'Septiembre 2023' },
    { id: 5, empleado: 'Lucía Torres', depto: 'Ventas', tardias: 5, faltas: 1, horas: '148h', cumplimiento: '82%', clasificacion: 'Riesgo Moderado', periodo: 'Septiembre 2023' },
    { id: 6, empleado: 'Ana Gómez', depto: 'Marketing', tardias: 2, faltas: 0, horas: '158h', cumplimiento: '95%', clasificacion: 'Bueno', periodo: 'Septiembre 2023' }
  ];

  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/']);
  }

  aplicarFiltros(): void {
    this.filtroBusqueda = '';
    this.filtroClasificacion = 'Todas las clasificaciones';
  }

  get resumenDepartamentosFiltrado(): KpiGlobalItem[] {
    return this.resumenDepartamentos.filter(
      (item) => item.periodo === this.periodoSeleccionado
    );
  }

  get deptoDataFiltrado(): KpiDepartamentoChartItem[] {
    return this.deptoData.filter(
      (item) => item.periodo === this.periodoSeleccionado
    );
  }

  get equipoDataFiltrado(): KpiEquipoChartItem[] {
    return this.equipoData.filter(
      (item) => item.periodo === this.periodoSeleccionado
    );
  }

  get clasificacionDataFiltrado(): KpiClasificacionChartItem[] {
    return this.clasificacionData.filter(
      (item) => item.periodo === this.periodoSeleccionado
    );
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
    const data = this.deptoDataFiltrado;
    if (!data.length) return '0%';

    const promedio = data.reduce((acc, item) => acc + item.kpi, 0) / data.length;
    return `${promedio.toFixed(1)}%`;
  }

  get tardiasMes(): number {
    return this.detalleFiltrado.reduce((acc, item) => acc + item.tardias, 0);
  }

  get faltasMes(): number {
    return this.detalleFiltrado.reduce((acc, item) => acc + item.faltas, 0);
  }

  get empleadosEnRiesgo(): number {
    return this.detalleFiltrado.filter(
      (item) =>
        item.clasificacion === 'Riesgo' ||
        item.clasificacion === 'Riesgo Moderado'
    ).length;
  }

  getClasificacionClass(clasificacion: string): string {
    if (clasificacion === 'Excelente') return 'status-badge--excellent';
    if (clasificacion === 'Bueno') return 'status-badge--good';
    if (clasificacion === 'Observación' || clasificacion === 'Regular') return 'status-badge--warning';
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
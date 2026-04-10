import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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
}

@Component({
  selector: 'app-kpi-equipo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kpi-equipo.html',
  styleUrl: './kpi-equipo.css',
})
export class KpiEquipo {
  modalPerfil = false;
  empleadoSeleccionado: EquipoItem | null = null;

  periodoSeleccionado = 'Marzo 2026';
  filtroBusqueda = '';
  filtroClasificacion = 'Todas las clasificaciones';

  observacionTemporal = '';
  observacionGuardadaMensaje = '';
  observacionError = '';

  periodos: Record<string, PeriodoData> = {
    'Marzo 2026': {
      chartData: [
        { name: 'Carlos', kpi: 95 },
        { name: 'Lucía', kpi: 88 },
        { name: 'Mario', kpi: 72 },
        { name: 'Ana', kpi: 98 },
        { name: 'José', kpi: 85 },
      ],
      equipoData: [
        {
          id: 1,
          empleado: 'Ana Gómez',
          kpi: '98%',
          clasificacion: 'Excelente',
          tendencia: 'up',
          observacion: '',
        },
        {
          id: 2,
          empleado: 'Carlos Mérida',
          kpi: '95%',
          clasificacion: 'Excelente',
          tendencia: 'up',
          observacion: '',
        },
        {
          id: 3,
          empleado: 'Lucía Torres',
          kpi: '88%',
          clasificacion: 'Bueno',
          tendencia: 'down',
          observacion: '',
        },
        {
          id: 4,
          empleado: 'José Luis',
          kpi: '85%',
          clasificacion: 'Bueno',
          tendencia: 'up',
          observacion: '',
        },
        {
          id: 5,
          empleado: 'Mario Paz',
          kpi: '72%',
          clasificacion: 'Regular',
          tendencia: 'down',
          alerta: true,
          observacion: '',
        },
      ],
    },
    'Febrero 2026': {
      chartData: [
        { name: 'Carlos', kpi: 89 },
        { name: 'Lucía', kpi: 84 },
        { name: 'Mario', kpi: 70 },
        { name: 'Ana', kpi: 93 },
        { name: 'José', kpi: 80 },
      ],
      equipoData: [
        {
          id: 1,
          empleado: 'Ana Gómez',
          kpi: '93%',
          clasificacion: 'Excelente',
          tendencia: 'up',
          observacion: '',
        },
        {
          id: 2,
          empleado: 'Carlos Mérida',
          kpi: '89%',
          clasificacion: 'Bueno',
          tendencia: 'down',
          observacion: '',
        },
        {
          id: 3,
          empleado: 'Lucía Torres',
          kpi: '84%',
          clasificacion: 'Bueno',
          tendencia: 'up',
          observacion: '',
        },
        {
          id: 4,
          empleado: 'José Luis',
          kpi: '80%',
          clasificacion: 'Bueno',
          tendencia: 'down',
          observacion: '',
        },
        {
          id: 5,
          empleado: 'Mario Paz',
          kpi: '70%',
          clasificacion: 'Regular',
          tendencia: 'down',
          alerta: true,
          observacion: '',
        },
      ],
    },
  };

  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/']);
  }

  verPerfil(empleado: EquipoItem): void {
    this.empleadoSeleccionado = empleado;
    this.modalPerfil = true;
    this.observacionTemporal = empleado.observacion ?? '';
    this.observacionGuardadaMensaje = '';
    this.observacionError = '';
  }

  cerrarModal(): void {
    this.modalPerfil = false;
    this.empleadoSeleccionado = null;
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

  getCorreoEmpleado(nombre: string): string {
    return `${nombre.toLowerCase().replace(/\s+/g, '.')}@mayarch.com`;
  }
}
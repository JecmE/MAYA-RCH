import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface PlanillaEmpleadoItem {
  id: number;
  empleado: string;
  puesto: string;
  salarioBase: string;
  bonificacion: string;
  deducciones: string;
  neto: string;
  estado: string;
}

@Component({
  selector: 'app-planilla',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './planilla.html',
  styleUrl: './planilla.css',
})
export class Planilla {
  periodo = '03-2026';
  tipoPlanilla = 'mensual';

  filtroBusqueda = '';
  filtroEstado = 'Todos los estados';

  mostrarMensajeExito = false;
  mensajeExito = '';

  modalBoleta = false;
  empleadoSeleccionado: PlanillaEmpleadoItem | null = null;

  planillaData: PlanillaEmpleadoItem[] = [
    {
      id: 1,
      empleado: 'Carlos Mérida',
      puesto: 'Analista RRHH',
      salarioBase: 'Q 8,500.00',
      bonificacion: 'Q 1,250.00',
      deducciones: 'Q 623.00',
      neto: 'Q 9,127.00',
      estado: 'Calculado'
    },
    {
      id: 2,
      empleado: 'Lucía Torres',
      puesto: 'Supervisor Operativo',
      salarioBase: 'Q 9,200.00',
      bonificacion: 'Q 1,500.00',
      deducciones: 'Q 710.00',
      neto: 'Q 9,990.00',
      estado: 'Calculado'
    },
    {
      id: 3,
      empleado: 'Ana López',
      puesto: 'Desarrolladora Frontend',
      salarioBase: 'Q 11,000.00',
      bonificacion: 'Q 1,800.00',
      deducciones: 'Q 920.00',
      neto: 'Q 11,880.00',
      estado: 'Pendiente'
    }
  ];

  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/']);
  }

  generarPlanilla(): void {
    this.mostrarNotificacion(
      `Planilla ${this.tipoPlanilla} generada para el período ${this.obtenerNombrePeriodo()}.`
    );
  }

  limpiarFiltros(): void {
    this.filtroBusqueda = '';
    this.filtroEstado = 'Todos los estados';
  }

  verBoleta(empleado: PlanillaEmpleadoItem): void {
    this.empleadoSeleccionado = empleado;
    this.modalBoleta = true;
  }

  cerrarModalBoleta(): void {
    this.modalBoleta = false;
    this.empleadoSeleccionado = null;
  }

  recalcularEmpleado(empleado: PlanillaEmpleadoItem): void {
    this.planillaData = this.planillaData.map((item) =>
      item.id === empleado.id
        ? {
            ...item,
            estado: 'Calculado'
          }
        : item
    );

    this.mostrarNotificacion(`Planilla recalculada para ${empleado.empleado}.`);
  }

  exportarExcel(): void {
    this.mostrarNotificacion('Exportación a Excel simulada correctamente.');
  }

  exportarPdf(): void {
    this.mostrarNotificacion('Exportación a PDF simulada correctamente.');
  }

  get planillaFiltrada(): PlanillaEmpleadoItem[] {
    const texto = this.filtroBusqueda.trim().toLowerCase();

    return this.planillaData.filter((empleado) => {
      const coincideBusqueda =
        !texto ||
        empleado.empleado.toLowerCase().includes(texto) ||
        empleado.puesto.toLowerCase().includes(texto);

      const coincideEstado =
        this.filtroEstado === 'Todos los estados' ||
        empleado.estado === this.filtroEstado;

      return coincideBusqueda && coincideEstado;
    });
  }

  get totalColaboradores(): number {
    return this.planillaData.length;
  }

  get totalDevengado(): string {
    const total = this.planillaData.reduce((acc, item) => {
      return acc + this.parseMoneda(item.salarioBase) + this.parseMoneda(item.bonificacion);
    }, 0);

    return this.formatearMoneda(total);
  }

  get totalDeducciones(): string {
    const total = this.planillaData.reduce((acc, item) => {
      return acc + this.parseMoneda(item.deducciones);
    }, 0);

    return this.formatearMoneda(total);
  }

  get totalNeto(): string {
    const total = this.planillaData.reduce((acc, item) => {
      return acc + this.parseMoneda(item.neto);
    }, 0);

    return this.formatearMoneda(total);
  }

  getEstadoClass(estado: string): string {
    if (estado === 'Calculado') {
      return 'status-badge--calculated';
    }

    return 'status-badge--pending';
  }

  private mostrarNotificacion(mensaje: string): void {
    this.mensajeExito = mensaje;
    this.mostrarMensajeExito = true;

    setTimeout(() => {
      this.mostrarMensajeExito = false;
      this.mensajeExito = '';
    }, 3000);
  }

  private parseMoneda(valor: string): number {
    return Number(valor.replace('Q', '').replace(/,/g, '').trim()) || 0;
  }

  private formatearMoneda(valor: number): string {
    return `Q ${valor.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

obtenerNombrePeriodo(): string {
  switch (this.periodo) {
    case '03-2026':
      return 'Marzo 2026';
    case '02-2026':
      return 'Febrero 2026';
    case '01-2026':
      return 'Enero 2026';
    default:
      return this.periodo;
  }
}

}
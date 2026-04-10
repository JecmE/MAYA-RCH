import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface BonoItem {
  id: number;
  empleado: string;
  departamento: string;
  cumplimiento: string;
  clasificacion: string;
  bono: string;
  estado: string;
  periodo: string;
  regla: string;
  motivo: string;
}

interface ReglaItem {
  id: string;
  nombre: string;
  periodo: string;
  vigencia: string;
  minAsistencia: string;
  maxTardias: number;
  estado: string;
  condiciones: string;
}

interface NuevaReglaForm {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  minAsistencia: number | null;
  maxTardias: number | null;
  condiciones: string;
  periodo: string;
}

@Component({
  selector: 'app-bonos-incentivos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bonos-incentivos.html',
  styleUrl: './bonos-incentivos.css',
})
export class BonosIncentivos {
  activeTab: 'resultados' | 'reglas' = 'resultados';

  filtroBusqueda = '';
  filtroPeriodo = 'Octubre 2023';
  mostrarMensajeExito = false;
  mensajeExito = '';

  modalNuevaRegla = false;
  modalDetalle = false;

  bonoSeleccionado: BonoItem | null = null;

  nuevaRegla: NuevaReglaForm = this.crearFormularioReglaVacio();

  bonosData: BonoItem[] = [
    {
      id: 1,
      empleado: 'Carlos Mérida',
      departamento: 'RRHH',
      cumplimiento: '96%',
      clasificacion: 'Excelente',
      bono: 'Q 1,500.00',
      estado: 'Elegible',
      periodo: 'Octubre 2023',
      regla: 'Bono Productividad 100%',
      motivo: 'Cumple criterios'
    },
    {
      id: 2,
      empleado: 'Lucía Torres',
      departamento: 'Operaciones',
      cumplimiento: '89%',
      clasificacion: 'Bueno',
      bono: 'Q 1,000.00',
      estado: 'Elegible',
      periodo: 'Octubre 2023',
      regla: 'Bono Productividad 100%',
      motivo: 'Cumple criterios'
    },
    {
      id: 3,
      empleado: 'Mario Paz',
      departamento: 'Tecnología',
      cumplimiento: '72%',
      clasificacion: 'Observación',
      bono: 'Q 0.00',
      estado: 'No elegible',
      periodo: 'Octubre 2023',
      regla: 'Bono Productividad 100%',
      motivo: 'Excede límite de tardías (4 > 0)'
    },
    {
      id: 4,
      empleado: 'Ana López',
      departamento: 'Tecnología',
      cumplimiento: '98%',
      clasificacion: 'Excelente',
      bono: 'Q 1,800.00',
      estado: 'Elegible',
      periodo: 'Octubre 2023',
      regla: 'Bono Asistencia Mensual',
      motivo: 'Cumple criterios'
    }
  ];

  reglasData: ReglaItem[] = [
    {
      id: 'R-01',
      nombre: 'Bono Productividad 100%',
      periodo: 'Mensual',
      vigencia: 'Indefinida',
      minAsistencia: '100%',
      maxTardias: 0,
      estado: 'Activo',
      condiciones: 'Cumplir asistencia total y cero tardías.'
    },
    {
      id: 'R-02',
      nombre: 'Bono Asistencia Mensual',
      periodo: 'Mensual',
      vigencia: '2023',
      minAsistencia: '98%',
      maxTardias: 2,
      estado: 'Activo',
      condiciones: 'Asistencia mínima del 98% y máximo 2 tardías.'
    }
  ];

  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/']);
  }

  setTab(tab: 'resultados' | 'reglas'): void {
    this.activeTab = tab;
  }

  abrirModalNuevaRegla(): void {
    this.nuevaRegla = this.crearFormularioReglaVacio();
    this.modalNuevaRegla = true;
  }

  cerrarModalNuevaRegla(): void {
    this.modalNuevaRegla = false;
  }

  cancelarNuevaRegla(): void {
    this.nuevaRegla = this.crearFormularioReglaVacio();
    this.modalNuevaRegla = false;
  }

  guardarNuevaRegla(): void {
    const nueva: ReglaItem = {
      id: this.generarIdRegla(),
      nombre: this.nuevaRegla.nombre.trim() || 'Nueva regla',
      periodo: this.nuevaRegla.periodo || 'Mensual',
      vigencia: this.obtenerVigenciaTexto(),
      minAsistencia: `${this.nuevaRegla.minAsistencia ?? 0}%`,
      maxTardias: this.nuevaRegla.maxTardias ?? 0,
      estado: 'Activo',
      condiciones: this.nuevaRegla.condiciones.trim() || 'Sin condiciones adicionales.'
    };

    this.reglasData = [nueva, ...this.reglasData];
    this.modalNuevaRegla = false;
    this.nuevaRegla = this.crearFormularioReglaVacio();
    this.mostrarNotificacion(`Regla ${nueva.id} creada correctamente.`);
  }

  verDetalle(bono: BonoItem): void {
    this.bonoSeleccionado = bono;
    this.modalDetalle = true;
  }

  cerrarDetalle(): void {
    this.modalDetalle = false;
    this.bonoSeleccionado = null;
  }

  recalcular(bono: BonoItem): void {
    this.bonosData = this.bonosData.map((item) => {
      if (item.id !== bono.id) {
        return item;
      }

      const cumplimiento = this.parsePorcentaje(item.cumplimiento);
      const elegible = cumplimiento >= 85;

      return {
        ...item,
        estado: elegible ? 'Elegible' : 'No elegible',
        bono: elegible ? item.bono : 'Q 0.00',
        motivo: elegible ? 'Cumple criterios' : 'No alcanza el cumplimiento mínimo'
      };
    });

    this.mostrarNotificacion(`Evaluación recalculada para ${bono.empleado}.`);
  }

  toggleEstadoRegla(regla: ReglaItem): void {
    this.reglasData = this.reglasData.map((item) =>
      item.id === regla.id
        ? { ...item, estado: item.estado === 'Activo' ? 'Inactivo' : 'Activo' }
        : item
    );

    this.mostrarNotificacion(`Estado actualizado para ${regla.nombre}.`);
  }

  exportarResultados(): void {
    this.mostrarNotificacion('Exportación de resultados realizada correctamente.');
  }

  ejecutarEvaluacion(): void {
    this.mostrarNotificacion(`Evaluación ejecutada para ${this.filtroPeriodo}.`);
  }

  get bonosFiltrados(): BonoItem[] {
    const texto = this.filtroBusqueda.trim().toLowerCase();

    return this.bonosData.filter((item) => {
      const coincideBusqueda =
        !texto || item.empleado.toLowerCase().includes(texto);

      const coincidePeriodo =
        !this.filtroPeriodo || item.periodo === this.filtroPeriodo;

      return coincideBusqueda && coincidePeriodo;
    });
  }

  get totalElegibles(): number {
    return this.bonosData.filter((item) => item.estado === 'Elegible').length;
  }

  get totalNoElegibles(): number {
    return this.bonosData.filter((item) => item.estado === 'No elegible').length;
  }

  get montoEstimado(): string {
    const total = this.bonosData.reduce((acc, item) => {
      if (item.estado !== 'Elegible') return acc;
      return acc + this.parseMoneda(item.bono);
    }, 0);

    return this.formatearMonedaCompacta(total);
  }

  get promedioBono(): string {
    const elegibles = this.bonosData.filter((item) => item.estado === 'Elegible');
    if (!elegibles.length) return 'Q 0';

    const total = elegibles.reduce((acc, item) => acc + this.parseMoneda(item.bono), 0);
    return this.formatearMonedaCompacta(Math.round(total / elegibles.length));
  }

  getEstadoClass(estado: string): string {
    if (estado === 'Elegible') {
      return 'status-badge--eligible';
    }
    return 'status-badge--not-eligible';
  }

  getClasificacionClass(clasificacion: string): string {
    if (clasificacion === 'Excelente') {
      return 'status-badge--excellent';
    }
    if (clasificacion === 'Bueno') {
      return 'status-badge--good';
    }
    return 'status-badge--warning';
  }

  getReglaEstadoClass(estado: string): string {
    return estado === 'Activo'
      ? 'status-badge--eligible'
      : 'status-badge--default';
  }

  private crearFormularioReglaVacio(): NuevaReglaForm {
    return {
      nombre: '',
      fechaInicio: '',
      fechaFin: '',
      minAsistencia: null,
      maxTardias: null,
      condiciones: '',
      periodo: 'Mensual'
    };
  }

  private generarIdRegla(): string {
    const ids = this.reglasData
      .map((item) => Number(item.id.replace('R-', '')))
      .filter((id) => !isNaN(id));

    const siguiente = ids.length ? Math.max(...ids) + 1 : 1;
    return `R-${String(siguiente).padStart(2, '0')}`;
  }

  private obtenerVigenciaTexto(): string {
    if (!this.nuevaRegla.fechaInicio && !this.nuevaRegla.fechaFin) {
      return 'Indefinida';
    }

    if (this.nuevaRegla.fechaInicio && !this.nuevaRegla.fechaFin) {
      return `Desde ${this.formatearFecha(this.nuevaRegla.fechaInicio)}`;
    }

    if (this.nuevaRegla.fechaInicio && this.nuevaRegla.fechaFin) {
      return `${this.formatearFecha(this.nuevaRegla.fechaInicio)} - ${this.formatearFecha(this.nuevaRegla.fechaFin)}`;
    }

    return 'Indefinida';
  }

  private formatearFecha(valor: string): string {
    if (!valor) return '';
    const [anio, mes, dia] = valor.split('-');
    return `${dia}/${mes}/${anio}`;
  }

  private parseMoneda(valor: string): number {
    return Number(valor.replace('Q', '').replace(/,/g, '').trim()) || 0;
  }

  private parsePorcentaje(valor: string): number {
    return Number(valor.replace('%', '').trim()) || 0;
  }

  private formatearMonedaCompacta(valor: number): string {
    if (valor >= 1000) {
      return `Q ${(valor / 1000).toFixed(valor % 1000 === 0 ? 0 : 1)}K`;
    }
    return `Q ${valor}`;
  }

  private mostrarNotificacion(mensaje: string): void {
    this.mensajeExito = mensaje;
    this.mostrarMensajeExito = true;

    setTimeout(() => {
      this.mostrarMensajeExito = false;
      this.mensajeExito = '';
    }, 3000);
  }
}
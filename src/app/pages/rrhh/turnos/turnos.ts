import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface TurnoItem {
  id: number;
  codigo: string;
  nombre: string;
  entrada: string;
  salida: string;
  tolerancia: string;
  horas: string;
  dias: string;
  estado: string;
}

interface TurnoForm {
  nombre: string;
  entrada: string;
  salida: string;
  tolerancia: number | null;
  estado: string;
  diasSeleccionados: string[];
}

@Component({
  selector: 'app-turnos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './turnos.html',
  styleUrl: './turnos.css',
})
export class Turnos {
  modalNuevoTurno = false;
  modalVerTurno = false;
  modoEdicion = false;

  mostrarMensajeExito = false;
  mensajeExito = '';

  filtroBusqueda = '';
  filtroEstado = 'Todos los estados';

  turnoSeleccionado: TurnoItem | null = null;
  turnoEditandoId: number | null = null;

  diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  nuevoTurno: TurnoForm = this.crearFormularioVacio();

  turnosData: TurnoItem[] = [
    {
      id: 1,
      codigo: 'T-01',
      nombre: 'Turno Administrativo',
      entrada: '08:00',
      salida: '17:00',
      tolerancia: '10 min',
      horas: '8 h',
      dias: 'L-V',
      estado: 'Activo'
    },
    {
      id: 2,
      codigo: 'T-02',
      nombre: 'Turno Matutino',
      entrada: '07:00',
      salida: '15:00',
      tolerancia: '5 min',
      horas: '8 h',
      dias: 'L-V',
      estado: 'Activo'
    },
    {
      id: 3,
      codigo: 'T-03',
      nombre: 'Turno Vespertino',
      entrada: '14:00',
      salida: '22:00',
      tolerancia: '10 min',
      horas: '8 h',
      dias: 'L-S',
      estado: 'Activo'
    },
    {
      id: 4,
      codigo: 'T-04',
      nombre: 'Turno Especial',
      entrada: '09:00',
      salida: '13:00',
      tolerancia: '0 min',
      horas: '4 h',
      dias: 'L-V',
      estado: 'Inactivo'
    }
  ];

  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/']);
  }

  abrirModalNuevoTurno(): void {
    this.modoEdicion = false;
    this.turnoEditandoId = null;
    this.nuevoTurno = this.crearFormularioVacio();
    this.modalNuevoTurno = true;
  }

  cerrarModalNuevoTurno(): void {
    this.modalNuevoTurno = false;
    this.modoEdicion = false;
    this.turnoEditandoId = null;
    this.nuevoTurno = this.crearFormularioVacio();
  }

  cancelarTurno(): void {
    this.cerrarModalNuevoTurno();
  }

  guardarTurno(): void {
    const diasTexto = this.formatearDiasSeleccionados(this.nuevoTurno.diasSeleccionados);
    const horasTexto = this.calcularHoras(this.nuevoTurno.entrada, this.nuevoTurno.salida);
    const toleranciaTexto = `${this.nuevoTurno.tolerancia ?? 0} min`;

    if (this.modoEdicion && this.turnoEditandoId !== null) {
      this.turnosData = this.turnosData.map((turno) =>
        turno.id === this.turnoEditandoId
          ? {
              ...turno,
              nombre: this.nuevoTurno.nombre || 'Sin nombre',
              entrada: this.nuevoTurno.entrada || '--:--',
              salida: this.nuevoTurno.salida || '--:--',
              tolerancia: toleranciaTexto,
              horas: horasTexto,
              dias: diasTexto,
              estado: this.nuevoTurno.estado || 'Activo'
            }
          : turno
      );

      this.mostrarNotificacion('Turno actualizado correctamente.');
    } else {
      const nuevo: TurnoItem = {
        id: this.obtenerSiguienteId(),
        codigo: this.generarCodigoTurno(),
        nombre: this.nuevoTurno.nombre || 'Sin nombre',
        entrada: this.nuevoTurno.entrada || '--:--',
        salida: this.nuevoTurno.salida || '--:--',
        tolerancia: toleranciaTexto,
        horas: horasTexto,
        dias: diasTexto,
        estado: this.nuevoTurno.estado || 'Activo'
      };

      this.turnosData = [nuevo, ...this.turnosData];
      this.mostrarNotificacion('Turno guardado correctamente.');
    }

    this.cerrarModalNuevoTurno();
  }

  verTurno(turno: TurnoItem): void {
    this.turnoSeleccionado = turno;
    this.modalVerTurno = true;
  }

  cerrarModalVerTurno(): void {
    this.modalVerTurno = false;
    this.turnoSeleccionado = null;
  }

  editarTurno(turno: TurnoItem): void {
    this.modoEdicion = true;
    this.turnoEditandoId = turno.id;

    this.nuevoTurno = {
      nombre: turno.nombre,
      entrada: turno.entrada,
      salida: turno.salida,
      tolerancia: this.extraerMinutos(turno.tolerancia),
      estado: turno.estado,
      diasSeleccionados: this.expandirDias(turno.dias)
    };

    this.modalNuevoTurno = true;
  }

  cambiarEstado(turno: TurnoItem): void {
    const nuevoEstado = turno.estado === 'Activo' ? 'Inactivo' : 'Activo';

    this.turnosData = this.turnosData.map((item) =>
      item.id === turno.id
        ? { ...item, estado: nuevoEstado }
        : item
    );

    this.mostrarNotificacion(`Estado actualizado a ${nuevoEstado} para ${turno.nombre}.`);
  }

  limpiarFiltros(): void {
    this.filtroBusqueda = '';
    this.filtroEstado = 'Todos los estados';
  }

  toggleDia(dia: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      if (!this.nuevoTurno.diasSeleccionados.includes(dia)) {
        this.nuevoTurno.diasSeleccionados = [...this.nuevoTurno.diasSeleccionados, dia];
      }
    } else {
      this.nuevoTurno.diasSeleccionados = this.nuevoTurno.diasSeleccionados.filter((d) => d !== dia);
    }
  }

  estaDiaSeleccionado(dia: string): boolean {
    return this.nuevoTurno.diasSeleccionados.includes(dia);
  }

  get turnosFiltrados(): TurnoItem[] {
    const texto = this.filtroBusqueda.trim().toLowerCase();

    return this.turnosData.filter((turno) => {
      const coincideBusqueda =
        !texto ||
        turno.nombre.toLowerCase().includes(texto) ||
        turno.codigo.toLowerCase().includes(texto);

      const coincideEstado =
        this.filtroEstado === 'Todos los estados' ||
        turno.estado === this.filtroEstado;

      return coincideBusqueda && coincideEstado;
    });
  }

  get totalTurnos(): number {
    return this.turnosData.length;
  }

  get totalActivos(): number {
    return this.turnosData.filter((turno) => turno.estado === 'Activo').length;
  }

  get totalInactivos(): number {
    return this.turnosData.filter((turno) => turno.estado === 'Inactivo').length;
  }

  get promedioTolerancia(): string {
    if (!this.turnosData.length) {
      return '0 min';
    }

    const total = this.turnosData.reduce((acc, turno) => {
      return acc + this.extraerMinutos(turno.tolerancia);
    }, 0);

    return `${Math.round(total / this.turnosData.length)} min`;
  }

  getEstadoClass(estado: string): string {
    if (estado === 'Activo') {
      return 'estado-badge--active';
    }
    return 'estado-badge--inactive';
  }

  private crearFormularioVacio(): TurnoForm {
    return {
      nombre: '',
      entrada: '',
      salida: '',
      tolerancia: 0,
      estado: 'Activo',
      diasSeleccionados: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie']
    };
  }

  private mostrarNotificacion(mensaje: string): void {
    this.mensajeExito = mensaje;
    this.mostrarMensajeExito = true;

    setTimeout(() => {
      this.mostrarMensajeExito = false;
      this.mensajeExito = '';
    }, 3000);
  }

  private obtenerSiguienteId(): number {
    return this.turnosData.length
      ? Math.max(...this.turnosData.map((turno) => turno.id)) + 1
      : 1;
  }

  private generarCodigoTurno(): string {
    return `T-${String(this.obtenerSiguienteId()).padStart(2, '0')}`;
  }

  private extraerMinutos(texto: string): number {
    const numero = parseInt(texto.replace(/\D/g, ''), 10);
    return isNaN(numero) ? 0 : numero;
  }

  private calcularHoras(entrada: string, salida: string): string {
    if (!entrada || !salida) {
      return '0 h';
    }

    const [hEntrada, mEntrada] = entrada.split(':').map(Number);
    const [hSalida, mSalida] = salida.split(':').map(Number);

    let minutosEntrada = hEntrada * 60 + mEntrada;
    let minutosSalida = hSalida * 60 + mSalida;

    if (minutosSalida < minutosEntrada) {
      minutosSalida += 24 * 60;
    }

    const diferenciaHoras = Math.round(((minutosSalida - minutosEntrada) / 60) * 10) / 10;

    return `${diferenciaHoras} h`;
  }

  private formatearDiasSeleccionados(dias: string[]): string {
    const orden = this.diasSemana.filter((dia) => dias.includes(dia));

    const lunesAViernes = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
    const lunesASabado = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    if (JSON.stringify(orden) === JSON.stringify(lunesAViernes)) {
      return 'L-V';
    }

    if (JSON.stringify(orden) === JSON.stringify(lunesASabado)) {
      return 'L-S';
    }

    if (orden.length === 7) {
      return 'L-D';
    }

    return orden.join(', ');
  }

  private expandirDias(dias: string): string[] {
    switch (dias) {
      case 'L-V':
        return ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
      case 'L-S':
        return ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      case 'L-D':
        return ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      default:
        return dias.split(',').map((dia) => dia.trim()).filter(Boolean);
    }
  }
}
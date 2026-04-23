import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService, Turno as TurnoBackend } from '../../../services/admin.service';

interface TurnoItem {
  id: number;
  codigo: string;
  nombre: string;
  entrada: string;
  salida: string;
  tolerancia: string;
  horas: string;
  estado: string;
}

interface TurnoForm {
  nombre: string;
  entrada: string;
  salida: string;
  tolerancia: number;
  estado: string;
  horasEsperadas: number;
}

@Component({
  selector: 'app-turnos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './turnos.html',
  styleUrl: './turnos.css',
})
export class Turnos implements OnInit {
  modalNuevoTurno = false;
  modoEdicion = false;

  mostrarMensajeExito = false;
  mensajeExito = '';

  filtroBusqueda = '';
  filtroEstado = 'Todos los estados';

  turnoEditandoId: number | null = null;
  nuevoTurno: TurnoForm = this.crearFormularioVacio();
  turnosData: TurnoItem[] = [];

  constructor(
    private router: Router,
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTurnos();
  }

  private loadTurnos(): void {
    this.adminService.getShifts().subscribe({
      next: (turnos) => {
        this.turnosData = turnos.map((t) => this.mapToItem(t));
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando turnos:', err);
        this.turnosData = [];
      },
    });
  }

  private mapToItem(t: TurnoBackend): TurnoItem {
    return {
      id: t.turnoId || 0,
      codigo: `T-${String(t.turnoId).padStart(3, '0')}`,
      nombre: t.nombre || 'Sin nombre',
      entrada: this.formatTimeDisplay(t.horaEntrada),
      salida: this.formatTimeDisplay(t.horaSalida),
      tolerancia: `${t.toleranciaMinutos ?? 0} min`,
      horas: `${t.horasEsperadasDia ?? 8} h`,
      estado: t.activo ? 'Activo' : 'Inactivo',
    };
  }

  private formatTimeDisplay(time: any): string {
    if (!time) return '--:--';
    // Si viene como objeto Date o string largo
    if (typeof time !== 'string') {
        const d = new Date(time);
        return d.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
    }
    return time.substring(0, 5);
  }

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
  }

  guardarTurno(): void {
    if (!this.nuevoTurno.nombre || !this.nuevoTurno.entrada || !this.nuevoTurno.salida) {
      alert('Por favor complete los campos obligatorios.');
      return;
    }

    const payload: Partial<TurnoBackend> = {
      nombre: this.nuevoTurno.nombre,
      horaEntrada: this.ensureSeconds(this.nuevoTurno.entrada),
      horaSalida: this.ensureSeconds(this.nuevoTurno.salida),
      toleranciaMinutos: this.nuevoTurno.tolerancia,
      horasEsperadasDia: this.nuevoTurno.horasEsperadas,
      activo: this.nuevoTurno.estado === 'Activo'
    };

    if (this.modoEdicion && this.turnoEditandoId !== null) {
      this.adminService.updateShift(this.turnoEditandoId, payload).subscribe({
        next: () => {
          this.mostrarNotificacion('Turno actualizado correctamente.');
          this.loadTurnos();
          this.cerrarModalNuevoTurno();
        },
        error: (err) => alert(err.error?.message || 'Error al actualizar')
      });
    } else {
      this.adminService.createShift(payload).subscribe({
        next: () => {
          this.mostrarNotificacion('Turno creado exitosamente.');
          this.loadTurnos();
          this.cerrarModalNuevoTurno();
        },
        error: (err) => alert(err.error?.message || 'Error al crear')
      });
    }
  }

  private ensureSeconds(timeStr: string): string {
    if (timeStr.split(':').length === 2) {
      return `${timeStr}:00`;
    }
    return timeStr;
  }

  editarTurno(turno: TurnoItem): void {
    this.modoEdicion = true;
    this.turnoEditandoId = turno.id;

    this.nuevoTurno = {
      nombre: turno.nombre,
      entrada: turno.entrada,
      salida: turno.salida,
      tolerancia: parseInt(turno.tolerancia),
      estado: turno.estado,
      horasEsperadas: parseFloat(turno.horas)
    };

    this.modalNuevoTurno = true;
  }

  limpiarFiltros(): void {
    this.filtroBusqueda = '';
    this.filtroEstado = 'Todos los estados';
  }

  get turnosFiltrados(): TurnoItem[] {
    const texto = this.filtroBusqueda.trim().toLowerCase();

    return this.turnosData.filter((turno) => {
      const coincideBusqueda =
        !texto || turno.nombre.toLowerCase().includes(texto) || turno.codigo.toLowerCase().includes(texto);

      const coincideEstado =
        this.filtroEstado === 'Todos los estados' || turno.estado === this.filtroEstado;

      return coincideBusqueda && coincideEstado;
    });
  }

  get totalTurnos(): number { return this.turnosData.length; }
  get totalActivos(): number { return this.turnosData.filter(t => t.estado === 'Activo').length; }
  get promedioTolerancia(): string {
    if (!this.turnosData.length) return '0 min';
    const sum = this.turnosData.reduce((acc, t) => acc + parseInt(t.tolerancia), 0);
    return `${Math.round(sum / this.turnosData.length)} min`;
  }

  getEstadoClass(estado: string): string {
    return estado === 'Activo' ? 'estado-badge--active' : 'estado-badge--inactive';
  }

  private crearFormularioVacio(): TurnoForm {
    return {
      nombre: '',
      entrada: '08:00',
      salida: '17:00',
      tolerancia: 15,
      estado: 'Activo',
      horasEsperadas: 8
    };
  }

  private mostrarNotificacion(mensaje: string): void {
    this.mensajeExito = mensaje;
    this.mostrarMensajeExito = true;
    setTimeout(() => this.mostrarMensajeExito = false, 3000);
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TimesheetsService, TeamTimesheetEntry } from '../../../services/timesheets.service';

interface TimesheetRegistro {
  id: number;
  empleado: string;
  proyecto: string;
  fecha: string;
  actividad: string;
  horas: number;
  estado: 'Pendiente' | 'Aprobado' | 'Observación' | 'Rechazado';
  comentario: string;
}

@Component({
  selector: 'app-timesheet-equipo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './timesheet-equipo.html',
  styleUrl: './timesheet-equipo.css',
})
export class TimesheetEquipo implements OnInit {
  searchTerm = '';
  selectedEstado = 'Todos los estados';
  selectedProyecto = 'Todos los proyectos';

  paginaActual = 1;
  registrosPorPagina = 5;

  registros: TimesheetRegistro[] = [];
  registrosFiltrados: TimesheetRegistro[] = [];

  constructor(
    private router: Router,
    private timesheetsService: TimesheetsService,
  ) {}

  ngOnInit(): void {
    this.loadTeamEntries();
  }

  private loadTeamEntries(): void {
    const supervisorId = this.getSupervisorId();
    if (!supervisorId) {
      this.registros = [];
      this.registrosFiltrados = [];
      return;
    }

    this.timesheetsService.getTeamEntries(supervisorId).subscribe({
      next: (data: TeamTimesheetEntry[]) => {
        this.registros = data.map((entry) => this.mapEntryToRegistro(entry));
        this.aplicarFiltros();
      },
      error: () => {
        this.registros = [];
        this.registrosFiltrados = [];
      },
    });
  }

  private getSupervisorId(): number | null {
    const empleadoIdStr = localStorage.getItem('empleadoId');
    return empleadoIdStr ? parseInt(empleadoIdStr, 10) : null;
  }

  private mapEntryToRegistro(entry: TeamTimesheetEntry): TimesheetRegistro {
    return {
      id: entry.tiempoId,
      empleado: entry.nombreCompleto || `Empleado ${entry.empleadoId}`,
      proyecto: entry.nombreProyecto || `Proyecto ${entry.proyectoId}`,
      fecha: entry.fecha,
      actividad: entry.actividadDescripcion || '',
      horas: entry.horas,
      estado: entry.estado as 'Pendiente' | 'Aprobado' | 'Observación' | 'Rechazado',
      comentario: '',
    };
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  getStatusClass(estado: string): string {
    switch (estado) {
      case 'Pendiente':
        return 'status-pending';
      case 'Aprobado':
        return 'status-approved';
      case 'Observación':
        return 'status-observation';
      case 'Rechazado':
        return 'status-rejected';
      default:
        return '';
    }
  }

  aplicarFiltros(): void {
    const termino = this.searchTerm.trim().toLowerCase();

    this.registrosFiltrados = this.registros.filter((row) => {
      const coincideBusqueda =
        !termino ||
        row.empleado.toLowerCase().includes(termino) ||
        row.proyecto.toLowerCase().includes(termino);

      const coincideEstado =
        this.selectedEstado === 'Todos los estados' || row.estado === this.selectedEstado;

      const coincideProyecto =
        this.selectedProyecto === 'Todos los proyectos' || row.proyecto === this.selectedProyecto;

      return coincideBusqueda && coincideEstado && coincideProyecto;
    });

    this.paginaActual = 1;
  }

  get registrosPaginados(): TimesheetRegistro[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;
    return this.registrosFiltrados.slice(inicio, fin);
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.registrosFiltrados.length / this.registrosPorPagina));
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
    }
  }

  aprobarRegistro(id: number): void {
    const defaultComment = 'Registro aprobado por supervisor';
    this.timesheetsService.approveEntry(id, defaultComment).subscribe({
      next: () => {
        const registro = this.registros.find((r) => r.id === id);
        if (registro) {
          registro.estado = 'Aprobado';
          registro.comentario = defaultComment;
          this.aplicarFiltros();
        }
      },
      error: () => {},
    });
  }

  rechazarRegistro(id: number): void {
    const defaultComment = 'Registro rechazado por supervisor';
    this.timesheetsService.rejectEntry(id, defaultComment).subscribe({
      next: () => {
        const registro = this.registros.find((r) => r.id === id);
        if (registro) {
          registro.estado = 'Rechazado';
          registro.comentario = defaultComment;
          this.aplicarFiltros();
        }
      },
      error: () => {},
    });
  }

  get totalPendientes(): number {
    return this.registros.filter((r) => r.estado === 'Pendiente').length;
  }

  get totalAprobados(): number {
    return this.registros.filter((r) => r.estado === 'Aprobado').length;
  }

  get totalObservacion(): number {
    return this.registros.filter((r) => r.estado === 'Observación').length;
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.selectedEstado = 'Todos los estados';
    this.selectedProyecto = 'Todos los proyectos';
    this.aplicarFiltros();
  }
}

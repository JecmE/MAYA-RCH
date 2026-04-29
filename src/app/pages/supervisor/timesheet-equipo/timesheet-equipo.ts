import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TimesheetsService, TeamTimesheetEntry } from '../../../services/timesheets.service';

interface TimesheetRegistro {
  id: number;
  empleado: string;
  empleadoId: number;
  proyecto: string;
  proyectoId: number;
  fecha: string;
  actividad: string;
  horas: number;
  estado: string;
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
  registrosPorPagina = 10;

  registros: TimesheetRegistro[] = [];
  registrosFiltrados: TimesheetRegistro[] = [];
  proyectosDisponibles: string[] = [];

  // Modal logic
  modalOpen = false;
  selectedRegistro: TimesheetRegistro | null = null;
  comentarioDecision = '';
  isProcessing = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private timesheetsService: TimesheetsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTeamEntries();
  }

  loadTeamEntries(): void {
    // 0 is passed but backend uses JWT user info
    this.timesheetsService.getTeamEntries(0).subscribe({
      next: (data: TeamTimesheetEntry[]) => {
        this.registros = data.map((entry) => this.mapEntryToRegistro(entry));
        this.extractProjects();
        this.aplicarFiltros();
        this.cdr.detectChanges();
      },
      error: () => {
        this.registros = [];
        this.registrosFiltrados = [];
        this.cdr.detectChanges();
      },
    });
  }

  private extractProjects(): void {
    const projs = new Set(this.registros.map(r => r.proyecto));
    this.proyectosDisponibles = Array.from(projs).sort();
  }

  private mapEntryToRegistro(entry: TeamTimesheetEntry): TimesheetRegistro {
    return {
      id: entry.tiempoId,
      empleado: entry.nombreCompleto || `ID: ${entry.empleadoId}`,
      empleadoId: entry.empleadoId,
      proyecto: entry.nombreProyecto || `ID: ${entry.proyectoId}`,
      proyectoId: entry.proyectoId,
      fecha: this.formatDate(entry.fecha),
      actividad: entry.actividadDescripcion || '',
      horas: entry.horas,
      estado: this.capitalize(entry.estado),
      comentario: '',
    };
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const userTimezoneOffset = d.getTimezoneOffset() * 60000;
    const correctedDate = new Date(d.getTime() + userTimezoneOffset);
    return correctedDate.toLocaleDateString('es-GT');
  }

  private capitalize(str: string): string {
    if (!str) return 'Pendiente';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  getStatusClass(estado: string): string {
    const e = estado.toLowerCase();
    if (e.includes('pendiente')) return 'status-pending';
    if (e.includes('aprobado')) return 'status-approved';
    if (e.includes('rechazado')) return 'status-rejected';
    return '';
  }

  aplicarFiltros(): void {
    const termino = this.searchTerm.trim().toLowerCase();

    this.registrosFiltrados = this.registros.filter((row) => {
      const coincideBusqueda =
        !termino ||
        row.empleado.toLowerCase().includes(termino) ||
        row.actividad.toLowerCase().includes(termino);

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

  openDecisionModal(registro: TimesheetRegistro): void {
    // Redirigir a la bandeja de pendientes con la pestaña de horas activa
    this.router.navigate(['/supervisor/pendientes'], { queryParams: { tab: 'horas' } });
  }

  closeModal(): void {
    this.modalOpen = false;
    this.selectedRegistro = null;
    this.isProcessing = false;
  }

  handleAprobar(): void {
    if (!this.selectedRegistro || this.isProcessing) return;
    if (!this.comentarioDecision.trim()) {
      this.errorMessage = 'El comentario es obligatorio para aprobar.';
      return;
    }

    this.isProcessing = true;
    this.timesheetsService.approveEntry(this.selectedRegistro.id, this.comentarioDecision).subscribe({
      next: () => {
        this.loadTeamEntries();
        this.closeModal();
      },
      error: (err) => {
        this.isProcessing = false;
        this.errorMessage = err.error?.message || 'Error al aprobar el registro.';
        this.cdr.detectChanges();
      }
    });
  }

  handleRechazar(): void {
    if (!this.selectedRegistro || this.isProcessing) return;
    if (!this.comentarioDecision.trim()) {
      this.errorMessage = 'El comentario es obligatorio para rechazar.';
      return;
    }

    this.isProcessing = true;
    this.timesheetsService.rejectEntry(this.selectedRegistro.id, this.comentarioDecision).subscribe({
      next: () => {
        this.loadTeamEntries();
        this.closeModal();
      },
      error: (err) => {
        this.isProcessing = false;
        this.errorMessage = err.error?.message || 'Error al rechazar el registro.';
        this.cdr.detectChanges();
      }
    });
  }

  get totalPendientes(): number {
    return this.registros.filter((r) => r.estado === 'Pendiente').length;
  }

  get totalAprobados(): number {
    return this.registros.filter((r) => r.estado === 'Aprobado').length;
  }

  get totalRechazados(): number {
    return this.registros.filter((r) => r.estado === 'Rechazado').length;
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.selectedEstado = 'Todos los estados';
    this.selectedProyecto = 'Todos los proyectos';
    this.aplicarFiltros();
  }
}

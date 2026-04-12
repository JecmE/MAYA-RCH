import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TimesheetsService, RegistroTiempo } from '../../services/timesheets.service';
import { ProjectsService, Proyecto } from '../../services/projects.service';

interface TimesheetRow {
  id: number;
  project: string;
  projectId?: number;
  projectCode?: string;
  date: string;
  activity: string;
  hours: string;
  hoursNum: number;
  status: string;
  comments: string;
  decision?: string;
}

@Component({
  selector: 'app-timesheet',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './timesheet.html',
  styleUrl: './timesheet.css',
})
export class Timesheet implements OnInit {
  proyecto = '';
  fecha = '';
  horas = '';
  actividad = '';

  filtroFecha = '';
  filtroProyecto = '';

  errorModal = false;
  errorMessage = '';
  successModal = false;

  historyData: TimesheetRow[] = [];
  proyectos: Proyecto[] = [];

  constructor(
    private router: Router,
    private timesheetsService: TimesheetsService,
    private projectsService: ProjectsService,
  ) {}

  ngOnInit(): void {
    this.loadProjects();
    this.loadEntries();
  }

  private loadProjects(): void {
    this.projectsService.getAll().subscribe({
      next: (proys) => {
        this.proyectos = proys.filter((p) => p.activo);
      },
      error: (err) => console.error('Error cargando proyectos:', err),
    });
  }

  private loadEntries(): void {
    this.timesheetsService.getMyEntries().subscribe({
      next: (entries) => {
        this.historyData = entries.map((e) => this.mapToRow(e));
      },
      error: (err) => {
        console.error('Error cargando timesheets:', err);
        this.historyData = [];
      },
    });
  }

  private mapToRow(e: RegistroTiempo): TimesheetRow {
    return {
      id: e.tiempoId || 0,
      project: (e as any).proyectoNombre || `Proyecto ${e.proyectoId}`,
      projectId: e.proyectoId,
      projectCode: (e as any).proyectoCodigo || '',
      date: e.fecha ? new Date(e.fecha).toLocaleDateString('en-US') : '',
      activity: e.actividadDescripcion || '',
      hours: e.horas ? `${e.horas} h` : '0 h',
      hoursNum: e.horas || 0,
      status:
        e.estado === 'aprobado' ? 'Aprobado' : e.estado === 'rechazado' ? 'Rechazado' : 'Pendiente',
      comments: (e as any).comentario || '',
      decision: (e as any).decision || '',
    };
  }

  get historyDataFiltrada(): TimesheetRow[] {
    return this.historyData.filter((row) => {
      const proyectoFila = row.project.trim().toLowerCase();
      const proyectoFiltro = this.filtroProyecto.trim().toLowerCase();

      const coincideProyecto = !proyectoFiltro || proyectoFila.includes(proyectoFiltro);

      const coincideFecha = !this.filtroFecha || this.convertirFecha(row.date) === this.filtroFecha;

      return coincideProyecto && coincideFecha;
    });
  }

  get horasNum(): number {
    return parseFloat(this.horas) || 0;
  }

  get showHoursWarning(): boolean {
    return this.horasNum > 8;
  }

  get canSubmit(): boolean {
    return (
      this.proyecto &&
      this.fecha &&
      this.horasNum > 0 &&
      this.horasNum <= 8 &&
      this.actividad.length >= 10
    );
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  handleValidar(): void {
    // Validaciones en frontend
    if (!this.proyecto) {
      this.errorMessage = 'Debe seleccionar un proyecto';
      this.errorModal = true;
      return;
    }

    if (!this.fecha) {
      this.errorMessage = 'Debe seleccionar una fecha';
      this.errorModal = true;
      return;
    }

    const horasVal = this.horasNum;
    if (horasVal <= 0) {
      this.errorMessage = 'Debe ingresar horas válidas (mayor a 0)';
      this.errorModal = true;
      return;
    }

    if (horasVal > 8) {
      this.errorMessage = 'No puede registrar más de 8 horas en un día';
      this.errorModal = true;
      return;
    }

    if (!this.actividad || this.actividad.length < 10) {
      this.errorMessage = 'La descripción de la actividad debe tener al menos 10 caracteres';
      this.errorModal = true;
      return;
    }

    // Validar fecha no sea futura
    const fechaSeleccionada = new Date(this.fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fechaSeleccionada > hoy) {
      this.errorMessage = 'No puede registrar tiempos para fechas futuras';
      this.errorModal = true;
      return;
    }

    this.guardarEntrada();
  }

  private guardarEntrada(): void {
    const proyectoId = this.proyectos.find(
      (p) => p.codigo === this.proyecto || p.nombre === this.proyecto,
    )?.proyectoId;

    if (!proyectoId) {
      this.errorMessage = 'Proyecto no válido';
      this.errorModal = true;
      return;
    }

    this.timesheetsService
      .createEntry({
        proyectoId,
        fecha: this.fecha,
        horas: this.horasNum,
        actividadDescripcion: this.actividad,
      })
      .subscribe({
        next: () => {
          this.successModal = true;
          this.limpiar();
          this.loadEntries();
        },
        error: (err) => {
          console.error('Error guardando entrada:', err);
          this.errorMessage = err.error?.message || 'Error al guardar el registro';
          this.errorModal = true;
        },
      });
  }

  closeErrorModal(): void {
    this.errorModal = false;
    this.errorMessage = '';
  }

  closeSuccessModal(): void {
    this.successModal = false;
  }

  limpiar(): void {
    this.proyecto = '';
    this.fecha = '';
    this.horas = '';
    this.actividad = '';
  }

  limpiarFiltros(): void {
    this.filtroFecha = '';
    this.filtroProyecto = '';
  }

  private convertirFecha(fecha: string): string {
    const partes = fecha.split('/');
    if (partes.length !== 3) return '';
    const mes = partes[0].padStart(2, '0');
    const dia = partes[1].padStart(2, '0');
    const anio = partes[2];
    return `${anio}-${mes}-${dia}`;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Aprobado':
        return 'status-approved';
      case 'Pendiente':
        return 'status-pending';
      case 'Rechazado':
        return 'status-rejected';
      default:
        return '';
    }
  }
}

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  isSubmitting = false;

  historyData: TimesheetRow[] = [];
  proyectos: Proyecto[] = [];

  constructor(
    private router: Router,
    private timesheetsService: TimesheetsService,
    private projectsService: ProjectsService,
    private cdr: ChangeDetectorRef,
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
      project: e.proyectoNombre || `Proyecto ${e.proyectoId}`,
      projectId: e.proyectoId,
      projectCode: e.proyectoCodigo || '',
      date: e.fecha ? this.formatDateForDisplay(e.fecha) : '',
      activity: e.actividadDescripcion || '',
      hours: e.horas ? `${e.horas} h` : '0 h',
      hoursNum: e.horas || 0,
      status:
        e.estado === 'aprobado' ? 'Aprobado' : e.estado === 'rechazado' ? 'Rechazado' : 'Pendiente',
      comments: e.comentario || '',
      decision: e.decision || '',
    };
  }

  get historyDataFiltrada(): TimesheetRow[] {
    return this.historyData.filter((row) => {
      const filtroFechaISO = this.filtroFecha;
      const filtroFechaDMY = filtroFechaISO ? this.convertToDMY(filtroFechaISO) : '';
      const coincideFecha = !filtroFechaISO || row.date === filtroFechaDMY;
      const filtroTrim = (this.filtroProyecto || '').trim();
      const rowCodeTrim = (row.projectCode || '').trim();
      const coincideProyecto = !filtroTrim || rowCodeTrim === filtroTrim;
      return coincideFecha && coincideProyecto;
    });
  }

  private formatDateForDisplay(dateValue: string | Date): string {
    if (!dateValue) return '';
    let d: Date;
    if (typeof dateValue === 'string') {
      const parts = dateValue.split('T')[0].split('-');
      if (parts.length === 3) {
        d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        d = new Date(dateValue);
      }
    } else {
      d = dateValue;
    }
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${month}/${day}/${d.getFullYear()}`;
  }

  private convertToDMY(isoDate: string): string {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${month}/${day}/${year}`;
  }

  get horasNum(): number {
    return parseFloat(this.horas) || 0;
  }

  get showHoursWarning(): boolean {
    return this.horasNum > 8;
  }

  get canSubmit(): boolean {
    return (
      Boolean(this.proyecto) &&
      Boolean(this.fecha) &&
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
    this.isSubmitting = true;

    const proyectoId = this.proyectos.find(
      (p) => p.codigo === this.proyecto || p.nombre === this.proyecto,
    )?.proyectoId;

    if (!proyectoId) {
      this.errorMessage = 'Proyecto no válido';
      this.errorModal = true;
      this.isSubmitting = false;
      return;
    }

    const saveTimeout = setTimeout(() => {
      console.warn('Save request is taking longer than expected...');
    }, 5000);

    this.timesheetsService
      .createEntry({
        proyectoId,
        fecha: this.fecha,
        horas: this.horasNum,
        actividadDescripcion: this.actividad,
      })
      .subscribe({
        next: () => {
          clearTimeout(saveTimeout);
          this.successModal = true;
          this.limpiar();
          this.loadEntries();
          this.isSubmitting = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          clearTimeout(saveTimeout);
          console.error('Error guardando entrada:', err);
          this.errorMessage = err.error?.message || 'Error al guardar el registro';
          this.errorModal = true;
          this.isSubmitting = false;
          this.cdr.detectChanges();
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

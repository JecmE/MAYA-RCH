import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TimesheetsService, RegistroTiempo } from '../../services/timesheets.service';
import { ProjectsService, Proyecto } from '../../services/projects.service';

interface TimesheetRow {
  id: number;
  project: string;
  projectId?: number;
  date: string;
  activity: string;
  hours: string;
  status: string;
  comments: string;
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
    const proj = this.proyectos.find((p) => p.proyectoId === e.proyectoId);
    return {
      id: e.tiempoId || 0,
      project: proj?.codigo || `Proyecto ${e.proyectoId}`,
      projectId: e.proyectoId,
      date: e.fecha ? new Date(e.fecha).toLocaleDateString('en-US') : '',
      activity: e.actividadDescripcion || '',
      hours: e.horas ? `${e.horas} h` : '0 h',
      status:
        e.estado === 'aprobado' ? 'Aprobado' : e.estado === 'rechazado' ? 'Rechazado' : 'Pendiente',
      comments: '',
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

  goBack(): void {
    this.router.navigate(['/']);
  }

  handleValidar(): void {
    const horasNum = parseFloat(this.horas);

    if (!isNaN(horasNum) && horasNum > 8) {
      this.errorModal = true;
    } else if (!isNaN(horasNum) && horasNum > 0 && this.proyecto && this.fecha) {
      this.guardarEntrada();
    }
  }

  private guardarEntrada(): void {
    const horasNum = parseFloat(this.horas);
    const proyectoId = this.proyectos.find(
      (p) => p.codigo === this.proyecto || p.nombre === this.proyecto,
    )?.proyectoId;
    if (!proyectoId) {
      this.errorModal = true;
      return;
    }

    this.timesheetsService
      .createEntry({
        proyectoId,
        fecha: this.convertirFechaParaBackend(this.fecha),
        horas: horasNum,
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
          this.errorModal = true;
        },
      });
  }

  closeErrorModal(): void {
    this.errorModal = false;
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

  private convertirFechaParaBackend(fecha: string): string {
    const partes = fecha.split('/');
    if (partes.length !== 3) return fecha;
    const mes = partes[0].padStart(2, '0');
    const dia = partes[1].padStart(2, '0');
    const anio = partes[2];
    return `${anio}-${mes}-${dia}`;
  }
}

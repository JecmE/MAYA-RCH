import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
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
export class Timesheet implements OnInit, OnDestroy {
  private routerSubscription?: Subscription;
  isBrowser: boolean;

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
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadAllData();
      this.routerSubscription = this.router.events
        .pipe(filter((e) => e instanceof NavigationEnd))
        .subscribe((event) => {
          if ((event as NavigationEnd).urlAfterRedirects === '/timesheet') {
            this.loadAllData();
          }
        });
    }
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  private loadAllData(): void {
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
        this.historyData = entries.map((e, index) => this.mapToRow(e, index));
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando timesheets:', err);
        this.historyData = [];
        this.cdr.detectChanges();
      },
    });
  }

  private mapToRow(e: RegistroTiempo, index: number): TimesheetRow {
    return {
      id: e.tiempoId ?? index + 1,
      project: e.proyectoNombre || `Proyecto ${e.proyectoId}`,
      projectId: e.proyectoId,
      projectCode: e.proyectoCodigo || '',
      date: e.fecha ? this.formatDateForDisplay(e.fecha) : '',
      activity: e.actividadDescripcion || '',
      hours: e.horas ? `${e.horas} h` : '0 h',
      hoursNum: e.horas || 0,
      status: this.capitalize(e.estado),
      comments: e.comentario || '',
      decision: e.decision || '',
    };
  }

  private capitalize(str: string): string {
    if (!str) return 'Pendiente';
    const s = str.toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  get historyDataFiltrada(): TimesheetRow[] {
    return this.historyData.filter((row) => {
      const coincideBusqueda = !this.filtroFecha || row.date === this.convertToDMY(this.filtroFecha);
      const coincideProyecto = !this.filtroProyecto || row.projectCode === this.filtroProyecto;
      return coincideBusqueda && coincideProyecto;
    });
  }

  private formatDateForDisplay(dateValue: string | Date): string {
    if (!dateValue) return '';
    const d = new Date(dateValue);
    const userTimezoneOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() + userTimezoneOffset).toLocaleDateString('es-GT');
  }

  private convertToDMY(isoDate: string): string {
    if (!isoDate) return '';
    const d = new Date(isoDate);
    const userTimezoneOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() + userTimezoneOffset).toLocaleDateString('es-GT');
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
    if (!this.proyecto || !this.fecha || this.horasNum <= 0 || this.horasNum > 8 || this.actividad.length < 10) {
      this.errorMessage = 'Por favor revisa los campos obligatorios y el límite de horas.';
      this.errorModal = true;
      return;
    }

    const fechaSeleccionada = new Date(this.fecha);
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    if (fechaSeleccionada > hoy) {
      this.errorMessage = 'No puedes registrar tiempos para fechas futuras.';
      this.errorModal = true;
      return;
    }

    this.guardarEntrada();
  }

  private guardarEntrada(): void {
    this.isSubmitting = true;
    const proyectoId = this.proyectos.find(p => p.codigo === this.proyecto)?.proyectoId;

    if (!proyectoId) {
      this.errorMessage = 'Proyecto no válido';
      this.errorModal = true;
      this.isSubmitting = false;
      return;
    }

    this.timesheetsService.createEntry({
      proyectoId,
      fecha: this.fecha,
      horas: this.horasNum,
      actividadDescripcion: this.actividad,
    }).subscribe({
      next: () => {
        this.successModal = true;
        this.limpiar();
        this.loadEntries();
        this.isSubmitting = false;
      },
      error: (err) => {
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
      case 'Aprobado': return 'status-approved';
      case 'Pendiente': return 'status-pending';
      case 'Rechazado': return 'status-rejected';
      default: return '';
    }
  }
}

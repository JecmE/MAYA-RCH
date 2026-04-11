import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LeavesService, SolicitudPermiso } from '../../../services/leaves.service';
import { TimesheetsService, TeamTimesheetEntry } from '../../../services/timesheets.service';

type TabType = 'permisos' | 'horas';

interface PermisoItem {
  id: number;
  empleado: string;
  tipo: string;
  fecha: string;
  estado: string;
  urgencia: string;
  dias: number;
}

interface HoraItem {
  id: number;
  empleado: string;
  proyecto: string;
  fecha: string;
  horas: number;
  estado: string;
}

type PendienteItem = PermisoItem | HoraItem;

@Component({
  selector: 'app-bandeja-pendientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bandeja-pendientes.html',
  styleUrl: './bandeja-pendientes.css',
})
export class BandejaPendientes implements OnInit {
  tab: TabType = 'permisos';
  modalOpen = false;
  selectedItem: PendienteItem | null = null;
  filtroEstado = 'Todos';

  permisosData: PermisoItem[] = [];
  horasData: HoraItem[] = [];

  constructor(
    private leavesService: LeavesService,
    private timesheetsService: TimesheetsService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loadPendingPermissions();
    this.loadPendingTimesheets();
  }

  private loadPendingPermissions(): void {
    this.leavesService.getPendingRequests().subscribe({
      next: (data: SolicitudPermiso[]) => {
        this.permisosData = data.map((s) => this.mapPermisoToItem(s));
      },
      error: () => {
        this.permisosData = [];
      },
    });
  }

  private loadPendingTimesheets(): void {
    const supervisorId = this.getSupervisorId();
    if (!supervisorId) {
      this.horasData = [];
      return;
    }

    this.timesheetsService.getTeamEntries(supervisorId).subscribe({
      next: (data: TeamTimesheetEntry[]) => {
        this.horasData = data
          .filter((entry) => entry.estado === 'Pendiente')
          .map((entry) => this.mapTimesheetToItem(entry));
      },
      error: () => {
        this.horasData = [];
      },
    });
  }

  private getSupervisorId(): number | null {
    const empleadoIdStr = localStorage.getItem('empleadoId');
    return empleadoIdStr ? parseInt(empleadoIdStr, 10) : null;
  }

  private mapPermisoToItem(s: SolicitudPermiso): PermisoItem {
    const daysDiff = this.calculateDays(s.fechaInicio, s.fechaFin);
    return {
      id: s.solicitudId ?? 0,
      empleado: `Empleado ${s.empleadoId}`,
      tipo: s.tipoPermiso?.nombre || 'Permiso',
      fecha: `${s.fechaInicio} - ${s.fechaFin}`,
      estado: s.estado || 'Pendiente',
      urgencia: daysDiff > 3 ? 'Alta' : 'Media',
      dias: daysDiff,
    };
  }

  private mapTimesheetToItem(entry: TeamTimesheetEntry): HoraItem {
    return {
      id: entry.tiempoId,
      empleado: entry.nombreCompleto || `Empleado ${entry.empleadoId}`,
      proyecto: entry.nombreProyecto || `Proyecto ${entry.proyectoId}`,
      fecha: entry.fecha,
      horas: entry.horas,
      estado: entry.estado,
    };
  }

  private calculateDays(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  setTab(tab: TabType): void {
    this.tab = tab;
  }

  handleVerDetalle(item: PendienteItem): void {
    this.selectedItem = item;
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
    this.selectedItem = null;
  }

  get datosFiltrados(): PendienteItem[] {
    const data = this.tab === 'permisos' ? this.permisosData : this.horasData;
    return data.filter(
      (item) => this.filtroEstado === 'Todos' || item.estado === this.filtroEstado,
    );
  }

  isPermiso(item: PendienteItem): item is PermisoItem {
    return this.tab === 'permisos';
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'Pendiente':
        return 'estado estado-pendiente';
      case 'Aprobado':
        return 'estado estado-aprobado';
      default:
        return 'estado estado-rechazado';
    }
  }

  getUrgenciaClass(urgencia: string): string {
    return urgencia === 'Alta' ? 'urgencia urgencia-alta' : 'urgencia urgencia-media';
  }
}

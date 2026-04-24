import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LeavesService } from '../../../services/leaves.service';
import { TimesheetsService, TeamTimesheetEntry } from '../../../services/timesheets.service';

type TabType = 'permisos' | 'horas';

interface PermisoItem {
  id: number;
  empleado: string;
  empleadoId: number;
  tipo: string;
  fecha: string;
  estado: string;
  urgency: string;
  dias: number;
  motivo: string;
  adjunto?: string;
  rawDate: string;
}

interface HoraItem {
  id: number;
  empleado: string;
  empleadoId: number;
  proyecto: string;
  fecha: string;
  horas: number;
  estado: string;
  actividad: string;
}

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
  selectedItem: any = null;
  filtroEstado = 'Pendiente';
  comentario = '';

  permisosData: PermisoItem[] = [];
  horasData: HoraItem[] = [];

  errorMessage = '';
  isProcessing = false;

  constructor(
    private leavesService: LeavesService,
    private timesheetsService: TimesheetsService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'horas' || params['tab'] === 'permisos') {
        this.tab = params['tab'] as TabType;
      }
      this.loadData();
    });
  }

  loadData(): void {
    this.loadPendingPermissions();
    this.loadPendingTimesheets();
  }

  private loadPendingPermissions(): void {
    this.leavesService.getPendingRequests().subscribe({
      next: (data: any[]) => {
        this.permisosData = data.map((s) => ({
          id: s.solicitudId,
          empleado: this.sanitizeName(s.empleado?.nombres && s.empleado?.apellidos ? `${s.empleado.nombres} ${s.empleado.apellidos}` : `ID: ${s.empleadoId}`),
          empleadoId: s.empleadoId,
          tipo: s.tipoPermiso?.nombre || s.tipoPermiso || 'Permiso',
          fecha: `${this.formatDate(s.fechaInicio)} - ${this.formatDate(s.fechaFin)}`,
          rawDate: s.fechaInicio,
          estado: this.capitalize(s.estado),
          urgency: this.calculateUrgency(s.fechaInicio),
          dias: this.calculateDays(s.fechaInicio, s.fechaFin),
          motivo: s.motivo || '',
          adjunto: s.adjuntos && s.adjuntos.length > 0 ? s.adjuntos[0].rutaUrl : undefined
        }));
        this.cdr.detectChanges();
      },
      error: () => {
        this.permisosData = [];
        this.cdr.detectChanges();
      },
    });
  }

  private loadPendingTimesheets(): void {
    this.timesheetsService.getTeamEntries(0).subscribe({
      next: (data: TeamTimesheetEntry[]) => {
        this.horasData = data.map((entry) => ({
          id: entry.tiempoId,
          empleado: this.sanitizeName(entry.nombreCompleto || `ID: ${entry.empleadoId}`),
          empleadoId: entry.empleadoId,
          proyecto: entry.nombreProyecto || `Proyecto ${entry.proyectoId}`,
          fecha: this.formatDate(entry.fecha),
          horas: entry.horas,
          estado: this.capitalize(entry.estado),
          actividad: entry.actividadDescripcion || ''
        }));
        this.cdr.detectChanges();
      },
      error: () => {
        this.horasData = [];
        this.cdr.detectChanges();
      },
    });
  }

  private sanitizeName(name: string): string {
    return name.replace(/Rodr\?guez/g, 'Rodríguez').replace(/Mart\?nez/g, 'Martínez')
               .replace(/Garc\?a/g, 'García').replace(/L\?pez/g, 'López');
  }

  private capitalize(str: string): string {
    if (!str) return 'Pendiente';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const userTimezoneOffset = d.getTimezoneOffset() * 60000;
    const correctedDate = new Date(d.getTime() + userTimezoneOffset);
    return correctedDate.toLocaleDateString('es-GT');
  }

  private calculateUrgency(startDateStr: string): string {
    const start = new Date(startDateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = start.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days <= 2) return 'Alta';
    if (days <= 5) return 'Media';
    return 'Baja';
  }

  private calculateDays(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = endDate.getTime() - startDate.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  }

  setTab(tab: TabType): void {
    this.tab = tab;
    this.filtroEstado = 'Pendiente';
  }

  handleVerDetalle(item: any): void {
    this.selectedItem = item;
    this.comentario = '';
    this.errorMessage = '';
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
    this.selectedItem = null;
    this.comentario = '';
    this.errorMessage = '';
  }

  handleAprobar(): void {
    if (!this.selectedItem || this.isProcessing) return;
    if (!this.comentario.trim()) {
      this.errorMessage = 'El comentario es obligatorio para aprobar.';
      return;
    }

    this.isProcessing = true;
    if (this.tab === 'permisos') {
      this.leavesService.approveRequest(this.selectedItem.id, this.comentario).subscribe({
        next: () => this.onActionSuccess(),
        error: (err) => this.onActionError(err)
      });
    } else {
      this.timesheetsService.approveEntry(this.selectedItem.id, this.comentario).subscribe({
        next: () => this.onActionSuccess(),
        error: (err) => this.onActionError(err)
      });
    }
  }

  handleRechazar(): void {
    if (!this.selectedItem || this.isProcessing) return;
    if (!this.comentario.trim()) {
      this.errorMessage = 'El comentario es obligatorio para rechazar.';
      return;
    }

    this.isProcessing = true;
    if (this.tab === 'permisos') {
      this.leavesService.rejectRequest(this.selectedItem.id, this.comentario).subscribe({
        next: () => this.onActionSuccess(),
        error: (err) => this.onActionError(err)
      });
    } else {
      this.timesheetsService.rejectEntry(this.selectedItem.id, this.comentario).subscribe({
        next: () => this.onActionSuccess(),
        error: (err) => this.onActionError(err)
      });
    }
  }

  private onActionSuccess(): void {
    this.isProcessing = false;
    this.loadData();
    this.closeModal();
  }

  private onActionError(err: any): void {
    this.isProcessing = false;
    this.errorMessage = err.error?.message || 'Error en el servidor.';
    this.cdr.detectChanges();
  }

  downloadAttachment(): void {
    if (this.tab === 'permisos' && this.selectedItem?.adjunto) {
      const url = this.selectedItem.adjunto;
      this.leavesService.downloadAttachment(url).subscribe({
        next: (blob) => {
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = 'adjunto_permiso';
          a.click();
          window.URL.revokeObjectURL(downloadUrl);
        },
        error: () => {
          this.errorMessage = 'No se pudo descargar el archivo.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  get pendingPermisosCount(): number {
    return this.permisosData.filter(p => p.estado === 'Pendiente').length;
  }

  get pendingHorasCount(): number {
    return this.horasData.filter(h => h.estado === 'Pendiente').length;
  }

  get datosFiltrados(): any[] {
    const data = this.tab === 'permisos' ? this.permisosData : this.horasData;
    return data.filter(
      (item) => this.filtroEstado === 'Todos' || item.estado === this.filtroEstado,
    );
  }

  getEstadoClass(estado: string): string {
    const e = estado.toLowerCase();
    if (e.includes('pendiente')) return 'estado estado-pendiente';
    if (e.includes('aprobado') || e.includes('aprobada')) return 'estado estado-approved';
    if (e.includes('rechazado') || e.includes('rechazada')) return 'estado estado-rejected';
    return 'estado';
  }

  getUrgenciaClass(urgencia: string): string {
    if (urgencia === 'Alta') return 'urgencia urgencia-alta';
    if (urgencia === 'Media') return 'urgencia urgencia-media';
    return 'urgencia urgencia-baja';
  }
}

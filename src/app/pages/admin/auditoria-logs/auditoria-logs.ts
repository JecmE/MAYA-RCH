import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService, AuditLog } from '../../../services/admin.service';

type TabType = 'funcional' | 'acceso' | 'errores';
type Severidad = 'Alta' | 'Media' | 'Baja';

interface AuditoriaLogItem {
  id: number;
  fecha: string;
  usuario: string;
  modulo: string;
  evento: string;
  accion: string;
  descripcion: string;
  severidad: Severidad;
  anterior: string | null;
  nuevo: string | null;
  ip: string;
}

interface AccesoLogItem {
  id: number;
  fecha: string;
  usuario: string;
  accion: string;
  ip: string;
  dispositivo: string;
  sesion: string | null;
}

interface ErrorLogItem {
  id: number;
  fecha: string;
  modulo: string;
  error: string;
  mensaje: string;
  severidad: 'Alta' | 'Media';
}

@Component({
  selector: 'app-auditoria-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auditoria-logs.html',
  styleUrl: './auditoria-logs.css',
})
export class AuditoriaLogs implements OnInit {
  activeTab: TabType = 'funcional';
  showFiltros = false;
  showDetalle = false;

  searchTerm = '';
  filtroAccion = '';
  filtroFecha = '';

  filtroModulo = '';
  filtroUsuario = '';
  filtroFechaInicio = '';
  filtroFechaFin = '';
  filtroTipoEvento = '';
  filtroSeveridad = '';

  eventoSeleccionado: AuditoriaLogItem | null = null;
  observacion = '';

  auditoriaData: AuditoriaLogItem[] = [];
  accesosData: AccesoLogItem[] = [];
  erroresData: ErrorLogItem[] = [];

  constructor(
    private router: Router,
    private adminService: AdminService,
  ) {}

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  private loadAuditLogs(): void {
    this.adminService.getAuditLogs().subscribe({
      next: (data: AuditLog[]) => {
        this.auditoriaData = data.map((log) => this.mapAuditLogToItem(log));
      },
      error: () => {
        this.auditoriaData = [];
      },
    });
  }

  private mapAuditLogToItem(log: AuditLog): AuditoriaLogItem {
    return {
      id: log.auditId,
      fecha: this.formatDateTime(log.fechaHora),
      usuario: log.usuario,
      modulo: log.modulo,
      evento: log.accion.toLowerCase().replace(/\s+/g, '.'),
      accion: log.accion,
      descripcion: log.detalle,
      severidad: 'Media',
      anterior: null,
      nuevo: null,
      ip: 'Sistema',
    };
  }

  private formatDateTime(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  setTab(tab: TabType): void {
    this.activeTab = tab;
    this.searchTerm = '';
    this.filtroFecha = '';
  }

  toggleFiltros(): void {
    this.showFiltros = !this.showFiltros;
  }

  abrirDetalle(evento: AuditoriaLogItem): void {
    this.eventoSeleccionado = evento;
    this.showDetalle = true;
    this.observacion = '';
  }

  cerrarDetalle(): void {
    this.showDetalle = false;
    this.eventoSeleccionado = null;
    this.observacion = '';
  }

  guardarObservacion(): void {
    console.log('Observación guardada:', this.observacion, this.eventoSeleccionado);
    this.cerrarDetalle();
  }

  get filteredAuditoriaData(): AuditoriaLogItem[] {
    return this.auditoriaData.filter((row) => {
      const coincideBusqueda =
        !this.searchTerm ||
        row.usuario.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        row.modulo.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        row.descripcion.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        row.evento.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        row.accion.toLowerCase().includes(this.searchTerm.toLowerCase());

      const coincideAccion = !this.filtroAccion || row.accion === this.filtroAccion;

      const coincideFecha = !this.filtroFecha || row.fecha.startsWith(this.filtroFecha);

      const coincideModulo = !this.filtroModulo || row.modulo === this.filtroModulo;

      const coincideUsuario = !this.filtroUsuario || row.usuario === this.filtroUsuario;

      const coincideTipoEvento = !this.filtroTipoEvento || row.evento === this.filtroTipoEvento;

      const coincideSeveridad = !this.filtroSeveridad || row.severidad === this.filtroSeveridad;

      const coincideFechaInicio = !this.filtroFechaInicio || row.fecha >= this.filtroFechaInicio;

      const coincideFechaFin =
        !this.filtroFechaFin || row.fecha <= `${this.filtroFechaFin} 23:59:59`;

      return (
        coincideBusqueda &&
        coincideAccion &&
        coincideFecha &&
        coincideModulo &&
        coincideUsuario &&
        coincideTipoEvento &&
        coincideSeveridad &&
        coincideFechaInicio &&
        coincideFechaFin
      );
    });
  }

  get filteredAccesosData(): AccesoLogItem[] {
    return this.accesosData.filter((row) => {
      const coincideBusqueda =
        !this.searchTerm ||
        row.usuario.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        row.accion.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        row.ip.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        row.dispositivo.toLowerCase().includes(this.searchTerm.toLowerCase());

      const coincideFecha = !this.filtroFecha || row.fecha.startsWith(this.filtroFecha);

      return coincideBusqueda && coincideFecha;
    });
  }

  get filteredErroresData(): ErrorLogItem[] {
    return this.erroresData.filter((row) => {
      const coincideBusqueda =
        !this.searchTerm ||
        row.modulo.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        row.error.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        row.mensaje.toLowerCase().includes(this.searchTerm.toLowerCase());

      const coincideFecha = !this.filtroFecha || row.fecha.startsWith(this.filtroFecha);

      return coincideBusqueda && coincideFecha;
    });
  }

  get totalEventosHoy(): number {
    return this.auditoriaData.length + this.accesosData.length + this.erroresData.length;
  }

  get totalLogins(): number {
    return this.accesosData.filter((x) => x.accion.toLowerCase().includes('login exitoso')).length;
  }

  get totalCambios(): number {
    return this.auditoriaData.filter((x) =>
      ['Edición', 'Creación', 'Cierre', 'Bloqueo', 'Cálculo'].includes(x.accion),
    ).length;
  }

  get totalExportaciones(): number {
    return this.auditoriaData.filter((x) => x.evento.toLowerCase().includes('export')).length;
  }

  get erroresAltos(): number {
    return this.erroresData.filter((x) => x.severidad === 'Alta').length;
  }

  getModulosUnicos(): string[] {
    return [...new Set(this.auditoriaData.map((x) => x.modulo))];
  }

  getUsuariosUnicos(): string[] {
    return [...new Set(this.auditoriaData.map((x) => x.usuario))];
  }

  getEventosUnicos(): string[] {
    return [...new Set(this.auditoriaData.map((x) => x.evento))];
  }

  getAccionClass(accion: string): string {
    switch (accion) {
      case 'Bloqueo':
        return 'badge badge--red';
      case 'Cálculo':
        return 'badge badge--slate';
      case 'Cierre':
        return 'badge badge--amber';
      case 'Creación':
        return 'badge badge--green';
      case 'Edición':
        return 'badge badge--blue';
      default:
        return 'badge badge--purple';
    }
  }

  getSeveridadClass(severidad: Severidad | 'Media'): string {
    switch (severidad) {
      case 'Alta':
        return 'severity severity--high';
      case 'Media':
        return 'severity severity--medium';
      default:
        return 'severity severity--low';
    }
  }

  limpiarFiltrosAvanzados(): void {
    this.filtroModulo = '';
    this.filtroUsuario = '';
    this.filtroFechaInicio = '';
    this.filtroFechaFin = '';
    this.filtroTipoEvento = '';
    this.filtroSeveridad = '';
  }
}

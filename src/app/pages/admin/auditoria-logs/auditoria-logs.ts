import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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
export class AuditoriaLogs {
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

  auditoriaData: AuditoriaLogItem[] = [
    {
      id: 1,
      fecha: '2026-03-27 14:30:12',
      usuario: 'admin',
      modulo: 'Seguridad',
      evento: 'user.block',
      accion: 'Bloqueo',
      descripcion: 'Usuario cmerida bloqueado tras 5 intentos fallidos',
      severidad: 'Alta',
      anterior: null,
      nuevo: 'bloqueado',
      ip: '192.168.1.100'
    },
    {
      id: 2,
      fecha: '2026-03-27 11:15:00',
      usuario: 'system',
      modulo: 'Asistencia',
      evento: 'attendance.close',
      accion: 'Cálculo',
      descripcion: 'Cierre automático de marcas sin salida del día 26/03',
      severidad: 'Baja',
      anterior: null,
      nuevo: null,
      ip: 'SISTEMA'
    },
    {
      id: 3,
      fecha: '2026-03-26 16:45:22',
      usuario: 'm.perez (RRHH)',
      modulo: 'Planilla',
      evento: 'payroll.close',
      accion: 'Cierre',
      descripcion: 'Cierre de período quincenal Q2-Marzo',
      severidad: 'Media',
      anterior: 'borrador',
      nuevo: 'cerrado',
      ip: '192.168.1.55'
    },
    {
      id: 4,
      fecha: '2026-03-26 09:20:05',
      usuario: 'admin',
      modulo: 'Usuarios',
      evento: 'user.create',
      accion: 'Creación',
      descripcion: 'Creación de cuenta ltorres',
      severidad: 'Baja',
      anterior: null,
      nuevo: 'activo',
      ip: '192.168.1.10'
    },
    {
      id: 5,
      fecha: '2026-03-25 15:10:44',
      usuario: 'admin',
      modulo: 'Parámetros',
      evento: 'config.update',
      accion: 'Edición',
      descripcion: 'Cambio de límite semanal de horas (15 a 20)',
      severidad: 'Media',
      anterior: '15',
      nuevo: '20',
      ip: '192.168.1.10'
    },
  ];

  accesosData: AccesoLogItem[] = [
    { id: 1, fecha: '2026-03-27 08:15:23', usuario: 'cmerida', accion: 'Login exitoso', ip: '192.168.1.45', dispositivo: 'Chrome 120 / Windows', sesion: 'SES-45872' },
    { id: 2, fecha: '2026-03-27 08:10:12', usuario: 'ltorres', accion: 'Login exitoso', ip: '192.168.1.72', dispositivo: 'Firefox 122 / MacOS', sesion: 'SES-45871' },
    { id: 3, fecha: '2026-03-27 08:05:44', usuario: 'alopez', accion: 'Login fallido', ip: '192.168.1.88', dispositivo: 'Chrome 120 / Windows', sesion: null },
    { id: 4, fecha: '2026-03-27 07:58:01', usuario: 'admin', accion: 'Login exitoso', ip: '192.168.1.10', dispositivo: 'Chrome 120 / Windows', sesion: 'SES-45870' },
  ];

  erroresData: ErrorLogItem[] = [
    { id: 1, fecha: '2026-03-27 14:32:18', modulo: 'API/Planilla', error: 'Error en cálculo de ISR', mensaje: 'Division by zero at payroll.calculateISR():line 342', severidad: 'Alta' },
    { id: 2, fecha: '2026-03-27 11:20:05', modulo: 'Database', error: 'Timeout en conexión', mensaje: 'Connection timeout after 30s to PostgreSQL', severidad: 'Media' },
  ];

  constructor(private router: Router) {}

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

      const coincideAccion =
        !this.filtroAccion || row.accion === this.filtroAccion;

      const coincideFecha =
        !this.filtroFecha || row.fecha.startsWith(this.filtroFecha);

      const coincideModulo =
        !this.filtroModulo || row.modulo === this.filtroModulo;

      const coincideUsuario =
        !this.filtroUsuario || row.usuario === this.filtroUsuario;

      const coincideTipoEvento =
        !this.filtroTipoEvento || row.evento === this.filtroTipoEvento;

      const coincideSeveridad =
        !this.filtroSeveridad || row.severidad === this.filtroSeveridad;

      const coincideFechaInicio =
        !this.filtroFechaInicio || row.fecha >= this.filtroFechaInicio;

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

      const coincideFecha =
        !this.filtroFecha || row.fecha.startsWith(this.filtroFecha);

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

      const coincideFecha =
        !this.filtroFecha || row.fecha.startsWith(this.filtroFecha);

      return coincideBusqueda && coincideFecha;
    });
  }

  get totalEventosHoy(): number {
    return this.auditoriaData.length + this.accesosData.length + this.erroresData.length;
  }

  get totalLogins(): number {
    return this.accesosData.filter(x => x.accion.toLowerCase().includes('login exitoso')).length;
  }

  get totalCambios(): number {
    return this.auditoriaData.filter(x =>
      ['Edición', 'Creación', 'Cierre', 'Bloqueo', 'Cálculo'].includes(x.accion)
    ).length;
  }

  get totalExportaciones(): number {
    return this.auditoriaData.filter(x => x.evento.toLowerCase().includes('export')).length;
  }

  get erroresAltos(): number {
    return this.erroresData.filter(x => x.severidad === 'Alta').length;
  }

  getModulosUnicos(): string[] {
    return [...new Set(this.auditoriaData.map(x => x.modulo))];
  }

  getUsuariosUnicos(): string[] {
    return [...new Set(this.auditoriaData.map(x => x.usuario))];
  }

  getEventosUnicos(): string[] {
    return [...new Set(this.auditoriaData.map(x => x.evento))];
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
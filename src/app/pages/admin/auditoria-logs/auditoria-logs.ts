import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  filtroModulo = '';
  filtroUsuario = '';
  filtroFechaInicio = '';
  filtroSeveridad = '';

  eventoSeleccionado: AuditoriaLogItem | null = null;
  observacion = '';

  auditoriaData: AuditoriaLogItem[] = [];
  accesosData: AccesoLogItem[] = [];
  erroresData: ErrorLogItem[] = [];

  constructor(
    private router: Router,
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  loadAuditLogs(): void {
    this.adminService.getAuditLogs().subscribe({
      next: (data: AuditLog[]) => {
        // Filtrar Logs Funcionales (Todo menos AUTH y errores técnicos puros)
        this.auditoriaData = data
            .filter(l => l.modulo !== 'AUTH')
            .map(log => this.mapAuditLogToItem(log));

        // Filtrar Logs de Acceso (Solo modulo AUTH)
        this.accesosData = data
            .filter(l => l.modulo === 'AUTH')
            .map(log => ({
                id: log.auditId,
                fecha: this.formatDateTime(log.fechaHora),
                usuario: this.extractUsername(log),
                accion: log.accion === 'LOGIN' ? 'Login Exitoso' : (log.accion.includes('FAIL') ? 'Intento Fallido' : 'Cierre de Sesión'),
                ip: this.extractIP(log.detalle),
                dispositivo: 'PC / Navegador',
                sesion: 'ID-' + log.auditId
            }));

        // Simulación de Errores (Si no hay tabla de errores técnicos, tomamos logins fallidos como críticos)
        this.erroresData = data
            .filter(l => l.accion.includes('FAIL') || l.modulo === 'ERROR')
            .map(log => ({
                id: log.auditId,
                fecha: this.formatDateTime(log.fechaHora),
                modulo: log.modulo,
                error: log.accion,
                mensaje: log.detalle,
                severidad: 'Alta'
            }));

        this.cdr.detectChanges();
      },
      error: () => {
        this.auditoriaData = [];
        this.cdr.detectChanges();
      },
    });
  }

  private extractUsername(log: any): string {
    if (log.usuario && typeof log.usuario === 'object') return log.usuario.username;
    if (log.usuario) return log.usuario;
    return 'Desconocido';
  }

  private extractIP(detalle: string): string {
    if (!detalle) return '127.0.0.1';
    const match = detalle.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
    return match ? match[0] : '127.0.0.1';
  }

  private mapAuditLogToItem(log: AuditLog): AuditoriaLogItem {
    return {
      id: log.auditId,
      fecha: this.formatDateTime(log.fechaHora),
      usuario: this.extractUsername(log),
      modulo: log.modulo,
      evento: log.entidad,
      accion: log.accion,
      descripcion: log.detalle,
      severidad: log.accion.includes('DELETE') ? 'Alta' : 'Media',
      anterior: null,
      nuevo: null,
      ip: this.extractIP(log.detalle),
    };
  }

  private formatDateTime(dateVal: any): string {
    if (!dateVal) return '';
    const date = new Date(dateVal);
    return date.toLocaleString('es-GT', { hour12: false });
  }

  goBack(): void { this.router.navigate(['/']); }
  setTab(tab: TabType): void { this.activeTab = tab; }
  toggleFiltros(): void { this.showFiltros = !this.showFiltros; }

  abrirDetalle(evento: AuditoriaLogItem): void {
    this.eventoSeleccionado = evento;
    this.showDetalle = true;
  }

  cerrarDetalle(): void { this.showDetalle = false; this.eventoSeleccionado = null; }
  guardarObservacion(): void { this.cerrarDetalle(); }

  // --- FILTRADO REACTIVO ---
  get filteredAuditoriaData(): AuditoriaLogItem[] {
    return this.auditoriaData.filter(row => {
      const matchSearch = !this.searchTerm ||
        row.usuario.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        row.descripcion.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchModulo = !this.filtroModulo || row.modulo === this.filtroModulo;
      const matchUsuario = !this.filtroUsuario || row.usuario === this.filtroUsuario;
      const matchSev = !this.filtroSeveridad || row.severidad === this.filtroSeveridad;
      return matchSearch && matchModulo && matchUsuario && matchSev;
    });
  }

  get filteredAccesosData(): AccesoLogItem[] {
    return this.accesosData.filter(row => {
      return !this.searchTerm ||
        row.usuario.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        row.ip.includes(this.searchTerm);
    });
  }

  get filteredErroresData(): ErrorLogItem[] {
    return this.erroresData.filter(row => {
        return !this.searchTerm || row.mensaje.toLowerCase().includes(this.searchTerm.toLowerCase());
    });
  }

  // --- MÉTODOS DE SOPORTE ---
  get totalEventosHoy(): number { return this.auditoriaData.length; }
  get totalLogins(): number { return this.accesosData.filter(x => x.accion.includes('Exitoso')).length; }
  get totalCambios(): number { return this.auditoriaData.filter(x => x.modulo === 'ADMIN' || x.modulo === 'RRHH').length; }
  get erroresAltos(): number { return this.erroresData.length; }

  getModulosUnicos(): string[] { return [...new Set(this.auditoriaData.map(x => x.modulo))]; }
  getUsuariosUnicos(): string[] { return [...new Set(this.auditoriaData.map(x => x.usuario))]; }

  getAccionClass(accion: string): string {
    const a = accion.toUpperCase();
    if (a.includes('DELETE') || a.includes('BLOQUE')) return 'badge badge--red';
    if (a.includes('CREATE') || a.includes('INSERT')) return 'badge badge--green';
    if (a.includes('UPDATE') || a.includes('EDIT')) return 'badge badge--blue';
    return 'badge badge--slate';
  }

  getSeveridadClass(severidad: string): string {
    if (severidad === 'Alta') return 'severity--high';
    if (severidad === 'Media') return 'severity--medium';
    return 'severity--low';
  }
}

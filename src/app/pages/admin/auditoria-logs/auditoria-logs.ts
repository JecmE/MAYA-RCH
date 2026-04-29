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
  fechaISO: string; // Para filtrado infalible (YYYY-MM-DD)
  usuario: string;
  modulo: string;
  evento: string;
  accion: string;
  descripcion: string;
  severidad: Severidad;
  ip: string;
}

interface AccesoLogItem {
  id: number;
  fecha: string;
  fechaISO: string;
  usuario: string;
  accion: string;
  ip: string;
  dispositivo: string;
}

interface ErrorLogItem {
  id: number;
  fecha: string;
  fechaISO: string;
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
  showDetalle = false;

  // Filtros
  searchTerm = '';
  filtroModulo = '';
  filtroUsuario = '';
  filtroSeveridad = '';
  filtroFechaInicio = ''; // YYYY-MM-DD del input date

  // Paginación
  currentPage = 1;
  pageSize = 10;

  eventoSeleccionado: AuditoriaLogItem | null = null;

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
        // --- 1. PROCESAR LOGS FUNCIONALES ---
        this.auditoriaData = data
            .filter(l => l.modulo !== 'AUTH' && l.modulo !== 'ERROR')
            .map(log => ({
                id: log.auditId,
                fecha: this.formatDateTimeDisplay(log.fechaHora),
                fechaISO: this.getISODate(log.fechaHora),
                usuario: this.extractUsername(log),
                modulo: log.modulo,
                evento: log.entidad,
                accion: log.accion,
                descripcion: log.detalle,
                severidad: log.accion.includes('DELETE') ? 'Alta' : (log.accion.includes('UPDATE') ? 'Media' : 'Baja'),
                ip: this.extractIP(log.detalle)
            }));

        // --- 2. PROCESAR LOGS DE ACCESO ---
        this.accesosData = data
            .filter(l => l.modulo === 'AUTH')
            .map(log => ({
                id: log.auditId,
                fecha: this.formatDateTimeDisplay(log.fechaHora),
                fechaISO: this.getISODate(log.fechaHora),
                usuario: this.extractUsername(log),
                accion: log.accion === 'LOGIN' ? 'Login Exitoso' : (log.accion.includes('FAIL') ? 'Intento Fallido' : 'Cierre de Sesión'),
                ip: this.extractIP(log.detalle),
                dispositivo: 'PC / Navegador'
            }));

        // --- 3. PROCESAR LOGS DE ERRORES ---
        this.erroresData = data
            .filter(l => l.modulo === 'ERROR' || l.accion.includes('FAIL'))
            .map(log => ({
                id: log.auditId,
                fecha: this.formatDateTimeDisplay(log.fechaHora),
                fechaISO: this.getISODate(log.fechaHora),
                modulo: log.modulo,
                error: log.accion,
                mensaje: log.detalle,
                severidad: 'Alta'
            }));

        this.cdr.detectChanges();
      },
      error: () => { this.auditoriaData = []; this.cdr.detectChanges(); }
    });
  }

  private extractUsername(log: any): string {
    if (log.usuario && typeof log.usuario === 'object') return log.usuario.username;
    return log.usuario || 'Desconocido';
  }

  private extractIP(detalle: string): string {
    if (!detalle) return '127.0.0.1';
    const match = detalle.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
    return match ? match[0] : '127.0.0.1';
  }

  private getISODate(dateVal: any): string {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    // Usar partes locales para evitar el desfase de zona horaria (UTC vs GT)
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDateTimeDisplay(dateVal: any): string {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    return d.toLocaleString('es-GT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
  }

  // --- FILTRADO POR PESTAÑA ---
  get filteredFuncional(): AuditoriaLogItem[] {
    return this.auditoriaData.filter(row => {
      const matchSearch = !this.searchTerm || row.usuario.toLowerCase().includes(this.searchTerm.toLowerCase()) || row.descripcion.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchMod = !this.filtroModulo || row.modulo === this.filtroModulo;
      const matchUser = !this.filtroUsuario || row.usuario === this.filtroUsuario;
      const matchSev = !this.filtroSeveridad || row.severidad === this.filtroSeveridad;
      const matchDate = !this.filtroFechaInicio || row.fechaISO === this.filtroFechaInicio; // COMPARACIÓN REAL
      return matchSearch && matchMod && matchUser && matchSev && matchDate;
    });
  }

  get filteredAcceso(): AccesoLogItem[] {
    return this.accesosData.filter(row => {
      const matchSearch = !this.searchTerm || row.usuario.toLowerCase().includes(this.searchTerm.toLowerCase()) || row.ip.includes(this.searchTerm);
      const matchUser = !this.filtroUsuario || row.usuario === this.filtroUsuario;
      const matchDate = !this.filtroFechaInicio || row.fechaISO === this.filtroFechaInicio;
      return matchSearch && matchUser && matchDate;
    });
  }

  get filteredErrores(): ErrorLogItem[] {
    return this.erroresData.filter(row => {
      const matchSearch = !this.searchTerm || row.mensaje.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchMod = !this.filtroModulo || row.modulo === this.filtroModulo;
      const matchDate = !this.filtroFechaInicio || row.fechaISO === this.filtroFechaInicio;
      return matchSearch && matchMod && matchDate;
    });
  }

  // --- PAGINACIÓN ---
  get paginatedData(): any[] {
    const data = this.activeTab === 'funcional' ? this.filteredFuncional : (this.activeTab === 'acceso' ? this.filteredAcceso : this.filteredErrores);
    const start = (this.currentPage - 1) * this.pageSize;
    return data.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    const data = this.activeTab === 'funcional' ? this.filteredFuncional : (this.activeTab === 'acceso' ? this.filteredAcceso : this.filteredErrores);
    return Math.ceil(data.length / this.pageSize) || 1;
  }

  // --- ACCIONES ---
  setTab(tab: TabType): void {
    this.activeTab = tab;
    this.currentPage = 1;
    this.limpiarFiltros();
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.filtroModulo = '';
    this.filtroUsuario = '';
    this.filtroSeveridad = '';
    this.filtroFechaInicio = '';
    this.currentPage = 1;
    this.cdr.detectChanges();
  }
  goBack(): void { this.router.navigate(['/']); }
  nextPage(): void { if (this.currentPage < this.totalPages) this.currentPage++; }
  prevPage(): void { if (this.currentPage > 1) this.currentPage--; }
  abrirDetalle(evento: AuditoriaLogItem): void { this.eventoSeleccionado = evento; this.showDetalle = true; }
  cerrarDetalle(): void { this.showDetalle = false; this.eventoSeleccionado = null; }

  // --- SOPORTE UI ---
  getModulosUnicos(): string[] { return [...new Set(this.auditoriaData.map(x => x.modulo))]; }
  getUsuariosUnicos(): string[] { return [...new Set([...this.auditoriaData.map(x => x.usuario), ...this.accesosData.map(x => x.usuario)])]; }
  getAccionClass(accion: string): string {
    const a = (accion || '').toUpperCase();
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

  get totalEventosHoy(): number { return this.auditoriaData.length; }
  get totalLogins(): number { return this.accesosData.filter(x => x.accion.includes('Exitoso')).length; }
  get totalCambios(): number { return this.auditoriaData.filter(x => x.modulo === 'ADMIN' || x.modulo === 'RRHH').length; }
  get erroresAltos(): number { return this.erroresData.length; }
}

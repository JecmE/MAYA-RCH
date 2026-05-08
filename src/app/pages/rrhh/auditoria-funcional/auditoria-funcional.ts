import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReportsService } from '../../../services/reports.service';

interface AuditoriaItem {
  id: number;
  fecha: string;
  usuario: string;
  modulo: string;
  accion: string;
  entidad: string;
  detalle: string;
}

@Component({
  selector: 'app-auditoria-funcional',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auditoria-funcional.html',
  styleUrl: './auditoria-funcional.css',
})
export class AuditoriaFuncional implements OnInit {
  filtroBusqueda = '';
  filtroModulo = 'Todos los módulos';
  filtroFechaDesde = this.getTodayISO();
  filtroFechaHasta = this.getTodayISO();

  registros: AuditoriaItem[] = [];
  isLoading = false;

  // Paginación
  paginaActual = 1;
  itemsPorPagina = 10;

  stats = {
    hoy: 0,
    aprobaciones: 0,
    ediciones: 0,
    sistema: 0
  };

  modulos = ['Todos los módulos'];

  private actionMap: { [key: string]: string } = {
    'LOGIN': 'Inicio de Sesión',
    'CREATE': 'Creación',
    'UPDATE': 'Actualización',
    'DELETE': 'Eliminación',
    'DEACTIVATE': 'Desactivación',
    'ACTIVATE': 'Activación',
    'APPROVE': 'Aprobación',
    'REJECT': 'Rechazo',
    'CREATE_BONUS_RULE': 'Creación Regla Bono',
    'UPDATE_BONUS_RULE': 'Actualización Regla Bono',
    'RUN_EVALUATION': 'Evaluación de Bonos',
    'SUBMIT': 'Envío',
    'ASSIGN': 'Asignación',
    'CHANGE_PASSWORD': 'Cambio de Contraseña',
    'LOGOUT': 'Cierre de Sesión'
  };

  constructor(
    private router: Router,
    private reportsService: ReportsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  loadAuditLogs(): void {
    this.isLoading = true;
    this.paginaActual = 1;
    this.reportsService.getFunctionalAudit(this.filtroFechaDesde, this.filtroFechaHasta, this.filtroModulo, this.filtroBusqueda).subscribe({
      next: (data) => {
        this.registros = data.map(log => ({
          id: log.audit_id,
          fecha: this.formatDateTime(log.fecha_hora),
          usuario: log.usuario || 'Sistema',
          modulo: log.modulo,
          accion: this.translateAction(log.accion),
          entidad: log.entidadId ? `${log.entidad} #${log.entidadId}` : log.entidad,
          detalle: log.detalle
        }));

        // Descubrimiento dinámico de módulos disponibles en los datos
        if (this.filtroModulo === 'Todos los módulos') {
          const modulosDetectados = Array.from(new Set(data.map(d => d.modulo))).filter(m => !!m).sort() as string[];
          this.modulos = ['Todos los módulos', ...modulosDetectados];
        }

        this.calculateStats(data);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private translateAction(action: string): string {
    if (!action) return '-';
    const upperAction = action.toUpperCase();
    return this.actionMap[upperAction] || action;
  }

  private calculateStats(data: any[]): void {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    this.stats.hoy = data.filter(d => d.fecha_hora.startsWith(today)).length;
    this.stats.aprobaciones = data.filter(d => {
      const a = (d.accion || '').toUpperCase();
      return a.includes('APPROVE') || a.includes('APROBAR');
    }).length;
    this.stats.ediciones = data.filter(d => {
      const a = (d.accion || '').toUpperCase();
      return a.includes('UPDATE') || a.includes('EDITAR') || a.includes('ACTUALIZACIÓN');
    }).length;
    this.stats.sistema = data.filter(d => !d.usuario || d.usuario === 'Sistema').length;
  }

  private formatDateTime(dateStr: string): string {
    if (!dateStr) return '';
    // El backend ya nos envía yyyy-MM-dd HH:mm:ss
    const [datePart, timePart] = dateStr.split(' ');
    const [y, m, d] = datePart.split('-');
    const [hh, mm] = timePart.split(':');
    return `${d}/${m}/${y} ${hh}:${mm}`;
  }

  private getTodayISO(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  get registrosPaginados(): AuditoriaItem[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.registros.slice(inicio, fin);
  }

  get totalPaginas(): number {
    return Math.ceil(this.registros.length / this.itemsPorPagina) || 1;
  }

  cambiarPagina(delta: number): void {
    const nuevaPagina = this.paginaActual + delta;
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.paginaActual = nuevaPagina;
      this.cdr.detectChanges();
    }
  }

  limpiarFiltros(): void {
    this.filtroBusqueda = '';
    this.filtroModulo = 'Todos los módulos';
    this.filtroFechaDesde = this.getTodayISO();
    this.filtroFechaHasta = this.getTodayISO();
    this.loadAuditLogs();
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}

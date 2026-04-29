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

  modulos = ['Todos los módulos', 'ADMIN', 'RRHH', 'SUPERVISOR', 'EMPLEADO', 'PAYROLL', 'AUTH'];

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
    const today = new Date().toISOString().split('T')[0];
    this.stats.hoy = data.filter(d => d.fecha_hora.startsWith(today)).length;
    this.stats.aprobaciones = data.filter(d => d.accion.includes('APPROVE') || d.accion.includes('APROBAR')).length;
    this.stats.ediciones = data.filter(d => d.accion.includes('UPDATE') || d.accion.includes('EDITAR')).length;
    this.stats.sistema = data.filter(d => !d.usuario).length;
  }

  private formatDateTime(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('es-GT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  private getTodayISO(): string {
    return new Date().toISOString().split('T')[0];
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

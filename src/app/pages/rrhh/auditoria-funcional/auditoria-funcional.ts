import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService, AuditLog } from '../../../services/admin.service';

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
  filtroFecha = '';

  registros: AuditoriaItem[] = [];

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
        this.registros = data.map((log) => this.mapAuditLogToItem(log));
      },
      error: () => {
        this.registros = [];
      },
    });
  }

  private mapAuditLogToItem(log: AuditLog): AuditoriaItem {
    return {
      id: log.auditId,
      fecha: this.formatDateTime(log.fechaHora),
      usuario: log.usuario,
      modulo: log.modulo,
      accion: log.accion,
      entidad: log.entidadId ? `${log.entidad} #${log.entidadId}` : log.entidad,
      detalle: log.detalle,
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
    return `${month}/${day}/${year} ${hours}:${minutes}`;
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  limpiarFiltros(): void {
    this.filtroBusqueda = '';
    this.filtroModulo = 'Todos los módulos';
    this.filtroFecha = '';
  }

  get registrosFiltrados(): AuditoriaItem[] {
    const texto = this.filtroBusqueda.trim().toLowerCase();

    return this.registros.filter((item) => {
      const coincideBusqueda =
        !texto ||
        item.usuario.toLowerCase().includes(texto) ||
        item.modulo.toLowerCase().includes(texto) ||
        item.entidad.toLowerCase().includes(texto) ||
        item.detalle.toLowerCase().includes(texto) ||
        item.accion.toLowerCase().includes(texto);

      const coincideModulo =
        this.filtroModulo === 'Todos los módulos' || item.modulo === this.filtroModulo;

      const coincideFecha =
        !this.filtroFecha || this.normalizarFechaRegistro(item.fecha) === this.filtroFecha;

      return coincideBusqueda && coincideModulo && coincideFecha;
    });
  }

  private normalizarFechaRegistro(fechaTexto: string): string {
    const soloFecha = fechaTexto.split(' ')[0].trim();
    const partes = soloFecha.split('/');

    if (partes.length !== 3) {
      return '';
    }

    const [mes, dia, anio] = partes;

    return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }
}

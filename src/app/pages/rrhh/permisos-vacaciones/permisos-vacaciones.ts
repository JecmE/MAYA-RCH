import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LeavesService } from '../../../services/leaves.service';

interface SolicitudItem {
  id: number;
  empleado: string;
  departamento: string;
  tipo: string;
  fechaSolicitud: string;
  periodo: string;
  estado: string;
  comentario: string;
  hasAdjunto: boolean;
  diasSolicitados: number;
  diasDisponibles: number;
  descuentaVacaciones: boolean; // Nueva propiedad real
}

interface SaldoItem {
  empleadoId: number;
  empleado: string;
  departamento: string;
  disponibles: number;
  usados: number;
  totales: number;
}

interface MovimientoItem {
  empleado: string;
  tipo: string;
  fecha: string;
  cantidad: number;
  motivo: string;
}

@Component({
  selector: 'app-permisos-vacaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './permisos-vacaciones.html',
  styleUrl: './permisos-vacaciones.css',
})
export class PermisosVacaciones implements OnInit {
  activeTab: 'solicitudes' | 'saldos' | 'movimientos' | 'tipos' = 'solicitudes';

  filtroBusqueda = '';
  filtroEstado = 'Todos';
  filtroTipo = 'Todos';
  filtroDepartamento = 'Todos los departamentos';

  modalDetalle = false;
  modalTipo = false;
  modalAjusteSaldo = false;
  modoEdicionTipo = false;
  isProcessing = false;

  solicitudSeleccionada: any = null;
  comentarioIntervencion = '';

  tipoEditando: any = { nombre: '', requiereDocumento: false, descuentaVacaciones: false, activo: true };
  ajusteSaldo: any = { empleadoId: 0, empleadoNombre: '', dlas: 0, motivo: '' };

  mostrarMensajeExito = false;
  mensajeExito = '';

  solicitudes: SolicitudItem[] = [];
  saldosData: SaldoItem[] = [];
  movimientosData: MovimientoItem[] = [];
  tiposData: any[] = [];

  constructor(
    private router: Router,
    private leavesService: LeavesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  setTab(tab: 'solicitudes' | 'saldos' | 'movimientos' | 'tipos'): void {
    this.activeTab = tab;
    this.loadData();
  }

  loadData(): void {
    if (this.activeTab === 'solicitudes') {
      this.leavesService.getAllRequests().subscribe(data => {
        this.solicitudes = data.map(s => ({
          id: s.solicitudId,
          empleado: s.empleadoNombre,
          departamento: s.departamento || '-',
          tipo: s.tipoPermisoNombre || 'Sin tipo',
          fechaSolicitud: this.formatDate(s.fechaSolicitud),
          periodo: `${this.formatDate(s.fechaInicio)} - ${this.formatDate(s.fechaFin)}`,
          estado: this.capitalize(s.estado),
          comentario: s.motivo || '',
          hasAdjunto: s.adjuntos && s.adjuntos.length > 0,
          diasSolicitados: s.diasSolicitados,
          diasDisponibles: s.diasDisponibles,
          descuentaVacaciones: s.tipoPermiso?.descuentaVacaciones ?? false
        }));
        this.cdr.detectChanges();
      });
    } else if (this.activeTab === 'saldos') {
      this.leavesService.getAllBalances().subscribe(data => {
        this.saldosData = data.map(s => ({
          empleadoId: s.empleadoId,
          empleado: s.empleadoNombre,
          departamento: s.departamento || '-',
          disponibles: s.diasDisponibles,
          usados: s.diasUsados,
          totales: Number(s.diasDisponibles) + Number(s.diasUsados)
        }));
        this.cdr.detectChanges();
      });
    } else if (this.activeTab === 'movimientos') {
      this.leavesService.getVacationMovements().subscribe(data => {
        this.movimientosData = data.map(m => ({
          empleado: m.empleadoNombre,
          tipo: this.capitalize(m.tipo),
          fecha: this.formatDate(m.fecha),
          cantidad: m.dias,
          motivo: m.comentario
        }));
        this.cdr.detectChanges();
      });
    } else if (this.activeTab === 'tipos') {
      this.leavesService.getTypes(true).subscribe(data => {
        this.tiposData = data;
        this.cdr.detectChanges();
      });
    }
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() + offset).toLocaleDateString('es-GT');
  }

  private capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  verDetalle(solicitud: any): void {
    this.solicitudSeleccionada = solicitud;
    this.comentarioIntervencion = '';
    this.modalDetalle = true;
  }

  get recomendacionRRHH(): string {
    if (!this.solicitudSeleccionada) return '';
    const disponibles = Number(this.solicitudSeleccionada.diasDisponibles);
    const solicitados = Number(this.solicitudSeleccionada.diasSolicitados);

    // Lógica basada en la configuración real del tipo de permiso
    if (!this.solicitudSeleccionada.descuentaVacaciones) {
      return 'ℹ️ Este permiso no descuenta vacaciones. Validar motivo y adjuntos si aplica.';
    }

    if (solicitados > disponibles) {
      return `⚠️ RIESGO: El empleado solicita ${solicitados} días pero solo tiene ${disponibles}. Se sugiere RECHAZAR.`;
    } else if (disponibles - solicitados < 2) {
      return `ℹ️ OBSERVACIÓN: El saldo quedará muy bajo (${disponibles - solicitados} días). Se sugiere confirmar con el supervisor.`;
    } else {
      return '✅ FACTIBLE: El empleado tiene saldo suficiente para cubrir esta solicitud.';
    }
  }

  intervenirSolicitud(estado: string): void {
    if (!this.comentarioIntervencion.trim()) {
      alert('Debe ingresar un comentario para la intervención.');
      return;
    }

    this.isProcessing = true;
    const action = estado === 'Aprobado'
      ? this.leavesService.approveRequest(this.solicitudSeleccionada.id, this.comentarioIntervencion)
      : this.leavesService.rejectRequest(this.solicitudSeleccionada.id, this.comentarioIntervencion);

    action.subscribe({
      next: () => {
        this.isProcessing = false;
        this.mostrarNotificacion(`Solicitud ${estado.toLowerCase()} correctamente.`);
        this.modalDetalle = false;
        this.loadData();
      },
      error: (err) => {
        this.isProcessing = false;
        alert(err.error?.message || 'Error al intervenir');
      }
    });
  }

  verAdjunto(solicitudId: number): void {
    this.leavesService.getAllRequests().subscribe(all => {
      const s = all.find(x => x.solicitudId === solicitudId);
      if (s && s.adjuntos && s.adjuntos.length > 0) {
        const url = s.adjuntos[0].rutaUrl;
        this.leavesService.downloadAttachment(url).subscribe({
          next: (blob) => {
            const fileUrl = URL.createObjectURL(blob);
            window.open(fileUrl, '_blank');
          },
          error: () => alert('Error al descargar el archivo.')
        });
      } else {
        alert('No se encontró el archivo adjunto.');
      }
    });
  }

  abrirAjusteSaldo(row: SaldoItem): void {
    this.ajusteSaldo = {
      empleadoId: row.empleadoId,
      empleadoNombre: row.empleado,
      dias: 0,
      motivo: ''
    };
    this.modalAjusteSaldo = true;
  }

  guardarAjusteSaldo(): void {
    if (!this.ajusteSaldo.motivo || this.ajusteSaldo.dias === 0) {
      alert('Indique los días a ajustar y el motivo.');
      return;
    }
    this.leavesService.adjustBalance(this.ajusteSaldo).subscribe({
      next: () => {
        this.mostrarNotificacion('Saldo ajustado correctamente.');
        this.modalAjusteSaldo = false;
        this.loadData();
      },
      error: (err) => alert(err.error?.message || 'Error al ajustar')
    });
  }

  abrirNuevoTipo(): void {
    this.modoEdicionTipo = false;
    this.tipoEditando = { nombre: '', requiereDocumento: false, descuentaVacaciones: false, activo: true };
    this.modalTipo = true;
  }

  editarTipo(tipo: any): void {
    this.modoEdicionTipo = true;
    this.tipoEditando = { ...tipo };
    this.modalTipo = true;
  }

  guardarTipo(): void {
    const action = this.modoEdicionTipo
      ? this.leavesService.updateType(this.tipoEditando.tipoPermisoId, this.tipoEditando)
      : this.leavesService.createType(this.tipoEditando);

    action.subscribe({
      next: () => {
        this.mostrarNotificacion('Tipo de permiso guardado.');
        this.modalTipo = false;
        this.loadData();
      },
      error: (err) => alert(err.error?.message || 'Error al guardar')
    });
  }

  private mostrarNotificacion(mensaje: string): void {
    this.mensajeExito = mensaje;
    this.mostrarMensajeExito = true;
    setTimeout(() => this.mostrarMensajeExito = false, 3000);
  }

  get filteredSolicitudes(): SolicitudItem[] {
    return this.solicitudes.filter(s => {
      const matchBusqueda = !this.filtroBusqueda || s.empleado.toLowerCase().includes(this.filtroBusqueda.toLowerCase());
      const matchEstado = this.filtroEstado === 'Todos' || s.estado === this.filtroEstado;
      const matchTipo = this.filtroTipo === 'Todos' || s.tipo === this.filtroTipo;
      const matchDep = this.filtroDepartamento === 'Todos los departamentos' || s.departamento === this.filtroDepartamento;
      return matchBusqueda && matchEstado && matchTipo && matchDep;
    });
  }

  get tiposUnicos(): string[] {
    return Array.from(new Set(this.solicitudes.map(s => s.tipo))).filter(t => t).sort();
  }

  get departamentos(): string[] {
    const deps = new Set<string>();
    this.solicitudes.forEach(s => { if(s.departamento && s.departamento !== '-') deps.add(s.departamento); });
    this.saldosData.forEach(s => { if(s.departamento && s.departamento !== '-') deps.add(s.departamento); });
    return Array.from(deps).sort();
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'Aprobado': return 'badge--green';
      case 'Pendiente': return 'badge--amber';
      case 'Rechazado': return 'badge--red';
      default: return 'badge--grey';
    }
  }
}

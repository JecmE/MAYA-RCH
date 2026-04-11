import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LeavesService, SolicitudPermiso, TipoPermiso } from '../../../services/leaves.service';

interface SolicitudItem {
  id: string;
  empleado: string;
  tipo: string;
  fechaSolicitud: string;
  periodo: string;
  saldo: string;
  estado: 'Pendiente' | 'Aprobado' | 'Rechazado';
  comentario: string;
  adjunto: 'Si' | 'No';
}

interface SaldoItem {
  empleado: string;
  disponibles: number;
  usados: number;
  restantes: number;
}

interface MovimientoItem {
  empleado: string;
  tipo: string;
  fecha: string;
  cantidad: number;
  motivo: string;
}

interface TipoPermisoItem {
  nombre: string;
  requiereDoc: 'Si' | 'No';
  descuentaVacaciones: 'Si' | 'No';
  estado: 'Activo' | 'Inactivo';
}

interface NuevaSolicitudForm {
  empleado: string;
  tipo: string;
  fechaSolicitud: string;
  periodo: string;
  saldo: string;
  estado: 'Pendiente' | 'Aprobado' | 'Rechazado';
  comentario: string;
  adjunto: 'Si' | 'No';
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
  filtroTipo = 'Todos los tipos';
  filtroEstado = 'Todos los estados';

  modalDetalle = false;
  modalNuevaSolicitud = false;

  solicitudSeleccionada: SolicitudItem | null = null;

  mostrarMensajeExito = false;
  mensajeExito = '';

  nuevaSolicitud: NuevaSolicitudForm = this.crearFormularioSolicitudVacio();

  solicitudes: SolicitudItem[] = [];
  saldosData: SaldoItem[] = [];
  movimientosData: MovimientoItem[] = [];
  tiposData: TipoPermisoItem[] = [];

  constructor(
    private router: Router,
    private leavesService: LeavesService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.leavesService.getMyRequests().subscribe({
      next: (data: SolicitudPermiso[]) => {
        this.solicitudes = data.map((s) => this.mapSolicitudToItem(s));
      },
      error: () => {
        this.solicitudes = [];
      },
    });

    this.leavesService.getTypes().subscribe({
      next: (data: TipoPermiso[]) => {
        this.tiposData = data.map((t) => this.mapTipoToItem(t));
      },
      error: () => {
        this.tiposData = [];
      },
    });

    this.leavesService.getVacationBalance().subscribe({
      next: (balance) => {
        this.saldosData = [
          {
            empleado: 'Empleado Actual',
            disponibles: balance.diasTotales,
            usados: balance.diasUsados,
            restantes: balance.diasDisponibles,
          },
        ];
      },
      error: () => {
        this.saldosData = [];
      },
    });
  }

  private mapSolicitudToItem(s: SolicitudPermiso): SolicitudItem {
    return {
      id: s.solicitudId?.toString() || '',
      empleado: `Empleado ${s.empleadoId}`,
      tipo: s.tipoPermiso?.nombre || 'Permiso',
      fechaSolicitud: s.fechaSolicitud || new Date().toLocaleDateString(),
      periodo: `${s.fechaInicio} - ${s.fechaFin}`,
      saldo: '',
      estado: (s.estado as 'Pendiente' | 'Aprobado' | 'Rechazado') || 'Pendiente',
      comentario: s.motivo || '',
      adjunto: 'No',
    };
  }

  private mapTipoToItem(t: TipoPermiso): TipoPermisoItem {
    return {
      nombre: t.nombre,
      requiereDoc: t.requiereDocumento ? 'Si' : 'No',
      descuentaVacaciones: t.descuentaVacaciones ? 'Si' : 'No',
      estado: t.activo ? 'Activo' : 'Inactivo',
    };
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  setTab(tab: 'solicitudes' | 'saldos' | 'movimientos' | 'tipos'): void {
    this.activeTab = tab;
  }

  limpiarFiltros(): void {
    this.filtroBusqueda = '';
    this.filtroTipo = 'Todos los tipos';
    this.filtroEstado = 'Todos los estados';
  }

  abrirModalNuevaSolicitud(): void {
    this.nuevaSolicitud = this.crearFormularioSolicitudVacio();
    this.modalNuevaSolicitud = true;
  }

  cerrarModalNuevaSolicitud(): void {
    this.modalNuevaSolicitud = false;
  }

  cancelarNuevaSolicitud(): void {
    this.nuevaSolicitud = this.crearFormularioSolicitudVacio();
    this.modalNuevaSolicitud = false;
  }

  guardarNuevaSolicitud(): void {
    const nueva: SolicitudItem = {
      id: this.generarIdSolicitud(),
      empleado: this.nuevaSolicitud.empleado.trim() || 'Sin empleado',
      tipo: this.nuevaSolicitud.tipo || 'Sin tipo',
      fechaSolicitud:
        this.formatearFechaInput(this.nuevaSolicitud.fechaSolicitud) ||
        this.obtenerFechaActualTexto(),
      periodo: this.nuevaSolicitud.periodo.trim() || 'Sin período',
      saldo: this.nuevaSolicitud.saldo.trim() || '0 días',
      estado: this.nuevaSolicitud.estado || 'Pendiente',
      comentario: this.nuevaSolicitud.comentario.trim() || 'Sin comentario',
      adjunto: this.nuevaSolicitud.adjunto || 'No',
    };

    this.solicitudes = [nueva, ...this.solicitudes];
    this.nuevaSolicitud = this.crearFormularioSolicitudVacio();
    this.modalNuevaSolicitud = false;
    this.mostrarNotificacion(`Solicitud ${nueva.id} creada correctamente.`);
  }

  verDetalle(solicitud: SolicitudItem): void {
    this.solicitudSeleccionada = solicitud;
    this.modalDetalle = true;
  }

  cerrarDetalle(): void {
    this.modalDetalle = false;
    this.solicitudSeleccionada = null;
  }

  aprobarSolicitud(solicitud: SolicitudItem): void {
    this.solicitudes = this.solicitudes.map((item) =>
      item.id === solicitud.id ? { ...item, estado: 'Aprobado' } : item,
    );

    this.mostrarNotificacion(`Solicitud ${solicitud.id} aprobada correctamente.`);
  }

  rechazarSolicitud(solicitud: SolicitudItem): void {
    this.solicitudes = this.solicitudes.map((item) =>
      item.id === solicitud.id ? { ...item, estado: 'Rechazado' } : item,
    );

    this.mostrarNotificacion(`Solicitud ${solicitud.id} rechazada correctamente.`);
  }

  get solicitudesFiltradas(): SolicitudItem[] {
    const texto = this.filtroBusqueda.trim().toLowerCase();

    return this.solicitudes.filter((item) => {
      const coincideBusqueda =
        !texto ||
        item.empleado.toLowerCase().includes(texto) ||
        item.tipo.toLowerCase().includes(texto);

      const coincideTipo = this.filtroTipo === 'Todos los tipos' || item.tipo === this.filtroTipo;

      const coincideEstado =
        this.filtroEstado === 'Todos los estados' || item.estado === this.filtroEstado;

      return coincideBusqueda && coincideTipo && coincideEstado;
    });
  }

  get solicitudesPendientes(): number {
    return this.solicitudes.filter((item) => item.estado === 'Pendiente').length;
  }

  get aprobadasHoy(): number {
    return this.solicitudes.filter((item) => item.estado === 'Aprobado').length;
  }

  get enVacaciones(): number {
    return this.solicitudes.filter(
      (item) => item.tipo === 'Vacaciones' && item.estado === 'Aprobado',
    ).length;
  }

  get rechazadas(): number {
    return this.solicitudes.filter((item) => item.estado === 'Rechazado').length;
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'Pendiente':
        return 'status-badge--pending';
      case 'Aprobado':
        return 'status-badge--approved';
      case 'Rechazado':
        return 'status-badge--rejected';
      default:
        return 'status-badge--default';
    }
  }

  getSaldoClass(restantes: number): string {
    if (restantes === 0) return 'status-badge--rejected';
    if (restantes < 5) return 'status-badge--pending';
    return 'status-badge--approved';
  }

  getMovimientoClass(tipo: string): string {
    switch (tipo) {
      case 'Uso':
        return 'status-badge--rejected';
      case 'Asignación':
        return 'status-badge--approved';
      default:
        return 'status-badge--info';
    }
  }

  getSiNoClass(valor: 'Si' | 'No'): string {
    return valor === 'Si' ? 'status-badge--info' : 'status-badge--default';
  }

  getTipoEstadoClass(estado: 'Activo' | 'Inactivo'): string {
    return estado === 'Activo' ? 'status-badge--approved' : 'status-badge--default';
  }

  private crearFormularioSolicitudVacio(): NuevaSolicitudForm {
    return {
      empleado: '',
      tipo: '',
      fechaSolicitud: '',
      periodo: '',
      saldo: '',
      estado: 'Pendiente',
      comentario: '',
      adjunto: 'No',
    };
  }

  private generarIdSolicitud(): string {
    const ids = this.solicitudes
      .map((item) => Number(item.id.replace('S-', '')))
      .filter((id) => !isNaN(id));

    const siguiente = ids.length ? Math.max(...ids) + 1 : 101;
    return `S-${siguiente}`;
  }

  private obtenerFechaActualTexto(): string {
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, '0');
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const anio = hoy.getFullYear();
    return `${dia}/${mes}/${anio}`;
  }

  private formatearFechaInput(valor: string): string {
    if (!valor) return '';
    const [anio, mes, dia] = valor.split('-');
    if (!anio || !mes || !dia) return valor;
    return `${dia}/${mes}/${anio}`;
  }

  private mostrarNotificacion(mensaje: string): void {
    this.mensajeExito = mensaje;
    this.mostrarMensajeExito = true;

    setTimeout(() => {
      this.mostrarMensajeExito = false;
      this.mensajeExito = '';
    }, 3000);
  }
}

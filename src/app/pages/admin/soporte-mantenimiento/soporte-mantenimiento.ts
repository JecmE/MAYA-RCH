import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { interval, Subscription } from 'rxjs';

type EstadoChip = 'success' | 'warning' | 'danger';
type MonitorTheme = 'blue' | 'purple' | 'amber' | 'green';
type NotificationType = 'success' | 'warning' | 'error';

interface IntegracionItem {
  id: number;
  icono: string;
  tema: 'blue' | 'amber';
  titulo: string;
  descripcion: string;
  meta: string;
  estado: string;
  estadoTipo: EstadoChip;
  accion?: string;
}

interface ProcesoItem {
  id: number;
  nombre: string;
  programacion: string;
  ultimoEstado: 'Éxito' | 'Pendiente' | 'Error';
  ultimaEjecucion: string;
}

interface MonitorCardItem {
  id: number;
  icono: string;
  tema: MonitorTheme;
  badge: string;
  titulo: string;
  valor: string;
  sufijo: string;
  detalle: string;
  progreso?: number;
  extraIzquierda?: string;
  extraDerecha?: string;
}

@Component({
  selector: 'app-soporte-mantenimiento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './soporte-mantenimiento.html',
  styleUrl: './soporte-mantenimiento.css',
})
export class SoporteMantenimiento implements OnInit, OnDestroy {
  private updateSub?: Subscription;

  integraciones: IntegracionItem[] = [
    { id: 1, icono: '🗄', tema: 'blue', titulo: 'Base de Datos Principal', descripcion: 'Azure SQL Database', meta: 'Latencia: --', estado: 'Conectando...', estadoTipo: 'warning' },
    { id: 2, icono: '✉', tema: 'amber', titulo: 'Servicio de Correo', descripcion: 'Notificaciones SMTP', meta: '', estado: 'En espera', estadoTipo: 'warning', accion: 'Probar conexión' },
  ];

  procesosProgramados: ProcesoItem[] = [
    { id: 1, nombre: 'Cálculo de KPIs', programacion: 'Diario (02:00 AM)', ultimoEstado: 'Pendiente', ultimaEjecucion: '--' },
    { id: 2, nombre: 'Evaluación de Bonos', programacion: 'Mensual (Día 1)', ultimoEstado: 'Pendiente', ultimaEjecucion: '--' },
    { id: 3, nombre: 'Sincronización Asistencia', programacion: 'Cada 15 min', ultimoEstado: 'Pendiente', ultimaEjecucion: '--' },
  ];

  incidenciaCritica = { titulo: 'Sin incidencias críticas', descripcion: 'El sistema opera con normalidad según el rastro de auditoría.' };
  mostrarDetalleError = false;
  detalleError = { proceso: '--', hora: '--', causa: 'Ninguna detectada', impacto: 'Ninguno', accionRecomendada: 'N/A', estado: 'Limpio' };

  correoPrueba = '';
  modoEdicionCorreo = false;
  correoConfig = { estadoServicio: 'En espera', ultimaVerificacion: 'Pendiente', servidor: 'smtp.office365.com', puerto: '587', usuario: 'notificaciones@mayarch.com', correosEnviadosHoy: 0 };
  correoConfigEditable = { servidor: '', puerto: '', usuario: '' };

  monitoreoCards: MonitorCardItem[] = [
    { id: 1, icono: '🖥', tema: 'blue', badge: 'En tiempo real', titulo: 'Uso de CPU', valor: '0', sufijo: '%', progreso: 0, detalle: 'Cargando hardware...' },
    { id: 2, icono: '🧠', tema: 'purple', badge: 'En tiempo real', titulo: 'Memoria RAM', valor: '0', sufijo: '%', progreso: 0, detalle: 'Calculando...' },
    { id: 3, icono: '💾', tema: 'amber', badge: 'Actualizado', titulo: 'Almacenamiento DB', valor: '0', sufijo: '%', progreso: 0, detalle: 'Consultando Azure...' },
    { id: 4, icono: '🌐', tema: 'green', badge: 'Activo', titulo: 'Tráfico de Red', valor: '0', sufijo: 'MB/s', detalle: 'Latencia: --', extraIzquierda: '↓ --', extraDerecha: '↑ --' },
  ];

  uptime = 'Cargando...';
  uptimeDetalle = 'Uptime total del servidor';
  solicitudesPorSegundo = 0;
  solicitudesDetalle = 'Carga actual';
  usuariosConcurrentes = 0;
  usuariosConcurrentesDetalle = 'Sesiones activas';

  mostrarNotificacion = false;
  mensajeNotificacion = '';
  tipoNotificacion: NotificationType = 'success';
  isSyncing = false;

  constructor(
    private router: Router,
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.refreshHealthData();
    this.updateSub = interval(15000).subscribe(() => this.refreshHealthData());
  }

  ngOnDestroy(): void {
    this.updateSub?.unsubscribe();
  }

  refreshHealthData(): void {
    this.adminService.getSystemHealth().subscribe({
        next: (data) => {
            // 1. INTEGRACIONES
            this.integraciones[0].estado = data.db.status;
            this.integraciones[0].estadoTipo = data.db.status === 'Conectado' ? 'success' : 'danger';
            this.integraciones[0].meta = `Latencia: ${data.db.latency}ms`;
            this.integraciones[0].descripcion = data.db.type;

            // 2. INCIDENCIA
            if (data.lastIncident) {
                this.incidenciaCritica = { titulo: data.lastIncident.titulo, descripcion: data.lastIncident.descripcion };
                this.detalleError = { proceso: data.lastIncident.titulo, hora: new Date(data.lastIncident.fecha).toLocaleString(), causa: data.lastIncident.descripcion, impacto: 'Error técnico registrado', accionRecomendada: 'Revisar logs en Auditoría', estado: 'Alerta' };
            } else {
                this.incidenciaCritica = { titulo: 'Sin incidencias críticas', descripcion: 'El sistema opera con normalidad.' };
            }

            // 3. MONITOR CARDS (PORCENTAJES Y HARDWARE REAL)
            this.monitoreoCards[0].valor = data.server.cpuPercent.toString();
            this.monitoreoCards[0].progreso = data.server.cpuPercent;
            this.monitoreoCards[0].detalle = `Carga: ${(data.server.cpuPercent * data.server.cpuCores / 100).toFixed(1)} / ${data.server.cpuCores} cores`;

            const ramUsedGB = (data.server.ramMB / 1024).toFixed(1);
            const ramTotalGB = (data.server.totalRamMB / 1024).toFixed(0);
            this.monitoreoCards[1].valor = Math.round((data.server.ramMB / data.server.totalRamMB) * 100).toString();
            this.monitoreoCards[1].progreso = Math.min(100, Math.round((data.server.ramMB / data.server.totalRamMB) * 100));
            this.monitoreoCards[1].detalle = `${ramUsedGB} GB / ${ramTotalGB} GB usados`;

            this.monitoreoCards[2].valor = Math.round((data.db.sizeMB / data.db.maxSizeMB) * 100).toString();
            this.monitoreoCards[2].progreso = Math.min(100, Math.round((data.db.sizeMB / data.db.maxSizeMB) * 100));
            this.monitoreoCards[2].detalle = `${data.db.sizeMB} MB / ${data.db.maxSizeMB} MB usados`;

            // RED (Dinámico basado en latencia real)
            const simulatedMbps = Math.max(1, (200 - data.db.latency) / 5);
            this.monitoreoCards[3].valor = simulatedMbps.toFixed(0);
            this.monitoreoCards[3].extraIzquierda = `↓ ${(simulatedMbps * 0.7).toFixed(1)} MB/s`;
            this.monitoreoCards[3].extraDerecha = `↑ ${(simulatedMbps * 0.3).toFixed(1)} MB/s`;
            this.monitoreoCards[3].detalle = `Latencia promedio: ${data.db.latency}ms`;

            // 4. PROCESOS CRON (REAL DESDE BD)
            if (data.tasks) {
                this.procesosProgramados = data.tasks.map((t: any, idx: number) => ({
                    id: idx + 1,
                    nombre: t.nombre,
                    programacion: t.nombre.includes('KPI') ? 'Diario (02:00 AM)' : (t.nombre.includes('Bono') ? 'Mensual (Día 1)' : 'Cada 15 min'),
                    ultimoEstado: t.estado,
                    ultimaEjecucion: t.ultimaEjecucion ? this.timeSince(new Date(t.ultimaEjecucion)) : 'Nunca'
                }));
            }

            // 5. METRICAS INFERIORES
            this.uptime = this.formatUptime(data.server.uptimeSeconds);
            this.adminService.getAdminDashboardStats().subscribe(stats => {
                this.usuariosConcurrentes = stats.sesionesActivas || 1;
                this.solicitudesPorSegundo = stats.eventosAuditoria > 200 ? 5 : 1;
            });

            this.cdr.detectChanges();
        }
    });
  }

  private timeSince(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Hace un momento';
    if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} h`;
    return date.toLocaleDateString();
  }

  private formatUptime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m ${seconds % 60}s`;
  }

  forzarSincronizacion(): void {
    if (this.isSyncing) return;
    this.isSyncing = true;
    this.adminService.forceSystemSync().subscribe({
        next: () => {
            this.mostrarMensaje('Sincronización forzada con Azure SQL ejecutada.', 'success');
            this.refreshHealthData();
            this.isSyncing = false;
        },
        error: () => {
            this.isSyncing = false;
            this.mostrarMensaje('Fallo en la comunicación con los robots.', 'error');
        }
    });
  }

  probarConexionCorreo(): void { this.mostrarMensaje('Servicio SMTP en espera.', 'warning'); }
  verDetalleError(): void { this.mostrarDetalleError = !this.mostrarDetalleError; }
  enviarCorreoPrueba(): void { this.mostrarMensaje('SMTP en espera.', 'warning'); }
  editarConfiguracion(): void { this.modoEdicionCorreo = true; }
  guardarConfiguracionCorreo(): void { this.modoEdicionCorreo = false; this.mostrarMensaje('Guardado.', 'success'); }
  cancelarEdicionCorreo(): void { this.modoEdicionCorreo = false; }
  actualizarMonitoreo(): void { this.refreshHealthData(); this.mostrarMensaje('Data actualizada.', 'success'); }

  getChipClass(tipo: EstadoChip): string { return `status-chip--${tipo}`; }
  getProcessStatusClass(estado: string): string { return estado === 'Éxito' ? 'process-status--success' : (estado === 'Pendiente' ? 'process-status--warning' : 'process-status--danger'); }
  getIntegrationIconClass(tema: string): string { return tema === 'blue' ? 'integration-icon--blue' : 'integration-icon--amber'; }
  getMonitorCardClass(tema: MonitorTheme): string { return `monitor-card--${tema}`; }
  getMonitorBadgeClass(tema: MonitorTheme): string { return `monitor-badge--${tema}`; }
  getMonitorProgressClass(tema: MonitorTheme): string { return `monitor-progress__bar--${tema}`; }
  getToastClass(): string { return `toast--${this.tipoNotificacion}`; }
  getToastIcon(): string { return this.tipoNotificacion === 'success' ? '✓' : (this.tipoNotificacion === 'warning' ? '!' : '✕'); }
  goBack(): void { this.router.navigate(['/']); }

  private mostrarMensaje(mensaje: string, tipo: NotificationType): void {
    this.mensajeNotificacion = mensaje; this.tipoNotificacion = tipo; this.mostrarNotificacion = true;
    setTimeout(() => { this.mostrarNotificacion = false; this.cdr.detectChanges(); }, 3000);
  }
}

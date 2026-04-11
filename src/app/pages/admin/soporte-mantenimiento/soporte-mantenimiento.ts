import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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
export class SoporteMantenimiento {
  integraciones: IntegracionItem[] = [
    {
      id: 1,
      icono: '🗄',
      tema: 'blue',
      titulo: 'Base de Datos Principal',
      descripcion: 'PostgreSQL v14 • Latencia: 12ms',
      meta: '',
      estado: 'Conectado',
      estadoTipo: 'success',
    },
    {
      id: 2,
      icono: '✉',
      tema: 'amber',
      titulo: 'Servicio de Correo (SMTP)',
      descripcion: 'Notificaciones y alertas de usuario',
      meta: '',
      estado: 'Operativo',
      estadoTipo: 'success',
      accion: 'Probar conexión',
    },
  ];

  procesosProgramados: ProcesoItem[] = [
    {
      id: 1,
      nombre: 'Cálculo de KPIs diarios',
      programacion: '02:00 AM',
      ultimoEstado: 'Éxito',
      ultimaEjecucion: 'Hoy, 02:05 AM',
    },
    {
      id: 2,
      nombre: 'Evaluación de Bonos',
      programacion: 'Mensual (Día 1)',
      ultimoEstado: 'Éxito',
      ultimaEjecucion: '01/10/2023, 03:00 AM',
    },
    {
      id: 3,
      nombre: 'Sincronización Asistencia',
      programacion: 'Cada 15 min',
      ultimoEstado: 'Pendiente',
      ultimaEjecucion: 'Hoy, 10:45 AM',
    },
    {
      id: 4,
      nombre: 'Respaldo Base de Datos',
      programacion: '00:00 AM',
      ultimoEstado: 'Error',
      ultimaEjecucion: 'Hoy, 00:02 AM',
    },
  ];

  incidenciaCritica = {
    titulo: 'Incidencia Crítica Detectada',
    descripcion:
      'Fallo en el último respaldo automático de la base de datos (00:02 AM). Espacio insuficiente en el volumen de almacenamiento secundario.',
  };

  mostrarDetalleError = false;

  detalleError = {
    proceso: 'Respaldo Base de Datos',
    hora: 'Hoy, 00:02 AM',
    causa: 'Espacio insuficiente en el volumen de almacenamiento secundario.',
    impacto: 'El respaldo automático no se completó y no se generó una copia íntegra.',
    accionRecomendada:
      'Liberar espacio, reintentar el respaldo y validar la integridad del archivo generado.',
    estado: 'Pendiente de intervención',
  };

  correoPrueba = '';

  correoConfig = {
    estadoServicio: 'Operativo',
    ultimaVerificacion: 'Hoy 10:30 AM',
    servidor: 'smtp.empresa.com',
    puerto: '587 (TLS)',
    usuario: 'notificaciones@empresa.com',
    correosEnviadosHoy: 142,
  };
  modoEdicionCorreo = false;

  correoConfigEditable = {
    servidor: '',
    puerto: '',
    usuario: '',
  };
  monitoreoCards: MonitorCardItem[] = [
    {
      id: 1,
      icono: '🖥',
      tema: 'blue',
      badge: 'En tiempo real',
      titulo: 'Uso de CPU',
      valor: '42',
      sufijo: '%',
      progreso: 42,
      detalle: 'Carga: 1.8 / 4 cores',
    },
    {
      id: 2,
      icono: '🧠',
      tema: 'purple',
      badge: 'En tiempo real',
      titulo: 'Memoria RAM',
      valor: '68',
      sufijo: '%',
      progreso: 68,
      detalle: '5.4 GB / 8 GB usados',
    },
    {
      id: 3,
      icono: '💾',
      tema: 'amber',
      badge: 'Actualizado',
      titulo: 'Almacenamiento',
      valor: '82',
      sufijo: '%',
      progreso: 82,
      detalle: '410 GB / 500 GB usados',
    },
    {
      id: 4,
      icono: '🌐',
      tema: 'green',
      badge: 'Activo',
      titulo: 'Tráfico de Red',
      valor: '24',
      sufijo: 'MB/s',
      detalle: 'Latencia promedio: 12ms',
      extraIzquierda: '↓ 18.5 MB/s',
      extraDerecha: '↑ 5.5 MB/s',
    },
  ];

  uptime = '99.8%';
  uptimeDetalle = '14 días, 6 horas activo';

  solicitudesPorSegundo = 142;
  solicitudesDetalle = '+12% vs promedio';

  usuariosConcurrentes = 42;
  usuariosConcurrentesDetalle = 'Sesiones activas ahora';

  mostrarNotificacion = false;
  mensajeNotificacion = '';
  tipoNotificacion: NotificationType = 'success';

  private notificationTimeout?: ReturnType<typeof setTimeout>;

  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/']);
  }

  forzarSincronizacion(): void {
    this.procesosProgramados = this.procesosProgramados.map((proceso) =>
      proceso.nombre === 'Sincronización Asistencia'
        ? {
            ...proceso,
            ultimoEstado: 'Éxito',
            ultimaEjecucion: this.obtenerMarcaDeTiempo('Hoy'),
          }
        : proceso,
    );

    this.mostrarMensaje('Sincronización ejecutada correctamente.', 'success');
  }

  probarConexionCorreo(): void {
    this.mostrarMensaje('Conexión SMTP verificada correctamente.', 'success');
  }

  verDetalleError(): void {
    this.mostrarDetalleError = !this.mostrarDetalleError;
  }

  enviarCorreoPrueba(): void {
    const correo = this.correoPrueba.trim();

    if (!correo || !correo.includes('@')) {
      this.mostrarMensaje('Ingresa un correo válido para la prueba.', 'error');
      return;
    }

    this.correoConfig.correosEnviadosHoy += 1;
    this.correoPrueba = '';
    this.mostrarMensaje('Correo de prueba enviado correctamente.', 'success');
  }

  editarConfiguracion(): void {
    this.correoConfigEditable = {
      servidor: this.correoConfig.servidor,
      puerto: this.correoConfig.puerto,
      usuario: this.correoConfig.usuario,
    };

    this.modoEdicionCorreo = true;
  }

  guardarConfiguracionCorreo(): void {
    if (
      !this.correoConfigEditable.servidor.trim() ||
      !this.correoConfigEditable.puerto.trim() ||
      !this.correoConfigEditable.usuario.trim()
    ) {
      this.mostrarMensaje('Completa todos los campos de la configuración SMTP.', 'error');
      return;
    }

    this.correoConfig = {
      ...this.correoConfig,
      servidor: this.correoConfigEditable.servidor.trim(),
      puerto: this.correoConfigEditable.puerto.trim(),
      usuario: this.correoConfigEditable.usuario.trim(),
    };

    this.modoEdicionCorreo = false;
    this.mostrarMensaje('Configuración SMTP actualizada correctamente.', 'success');
  }

  cancelarEdicionCorreo(): void {
    this.modoEdicionCorreo = false;
    this.correoConfigEditable = {
      servidor: '',
      puerto: '',
      usuario: '',
    };
  }
  actualizarMonitoreo(): void {
    const cpu = this.randomInt(35, 60);
    const ram = this.randomInt(60, 78);
    const disco = this.randomInt(78, 88);

    const descarga = this.randomFloat(14, 24);
    const subida = this.randomFloat(4, 8);
    const totalRed = (descarga + subida).toFixed(0);

    this.monitoreoCards = this.monitoreoCards.map((item) => {
      if (item.titulo === 'Uso de CPU') {
        return {
          ...item,
          valor: String(cpu),
          progreso: cpu,
          detalle: `Carga: ${(cpu / 25).toFixed(1)} / 4 cores`,
        };
      }

      if (item.titulo === 'Memoria RAM') {
        return {
          ...item,
          valor: String(ram),
          progreso: ram,
          detalle: `${(ram * 0.08).toFixed(1)} GB / 8 GB usados`,
        };
      }

      if (item.titulo === 'Almacenamiento') {
        return {
          ...item,
          valor: String(disco),
          progreso: disco,
          detalle: `${Math.round((disco / 100) * 500)} GB / 500 GB usados`,
        };
      }

      return {
        ...item,
        valor: totalRed,
        extraIzquierda: `↓ ${descarga.toFixed(1)} MB/s`,
        extraDerecha: `↑ ${subida.toFixed(1)} MB/s`,
        detalle: `Latencia promedio: ${this.randomInt(10, 18)}ms`,
      };
    });

    this.solicitudesPorSegundo = this.randomInt(120, 165);
    this.usuariosConcurrentes = this.randomInt(36, 52);

    this.mostrarMensaje('Monitoreo actualizado.', 'success');
  }

  getChipClass(tipo: EstadoChip): string {
    if (tipo === 'success') return 'status-chip--success';
    if (tipo === 'warning') return 'status-chip--warning';
    return 'status-chip--danger';
  }

  getProcessStatusClass(estado: string): string {
    if (estado === 'Éxito') return 'process-status--success';
    if (estado === 'Pendiente') return 'process-status--warning';
    return 'process-status--danger';
  }

  getIntegrationIconClass(tema: 'blue' | 'amber'): string {
    return tema === 'blue' ? 'integration-icon--blue' : 'integration-icon--amber';
  }

  getMonitorCardClass(tema: MonitorTheme): string {
    return `monitor-card--${tema}`;
  }

  getMonitorBadgeClass(tema: MonitorTheme): string {
    return `monitor-badge--${tema}`;
  }

  getMonitorProgressClass(tema: MonitorTheme): string {
    return `monitor-progress__bar--${tema}`;
  }

  getToastClass(): string {
    return `toast--${this.tipoNotificacion}`;
  }

  getToastIcon(): string {
    if (this.tipoNotificacion === 'success') return '✓';
    if (this.tipoNotificacion === 'warning') return '!';
    return '✕';
  }

  private mostrarMensaje(mensaje: string, tipo: NotificationType): void {
    this.mensajeNotificacion = mensaje;
    this.tipoNotificacion = tipo;
    this.mostrarNotificacion = true;

    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }

    this.notificationTimeout = setTimeout(() => {
      this.mostrarNotificacion = false;
      this.mensajeNotificacion = '';
    }, 3000);
  }

  private obtenerMarcaDeTiempo(prefijo: string): string {
    const now = new Date();
    const horas = String(now.getHours()).padStart(2, '0');
    const minutos = String(now.getMinutes()).padStart(2, '0');
    return `${prefijo}, ${horas}:${minutos}`;
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private randomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }
}

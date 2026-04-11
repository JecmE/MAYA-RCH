import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface SesionActivaItem {
  id: number;
  usuario: string;
  ip: string;
  dispositivo: string;
  ultimoAcceso: string;
  estado: 'Activa' | 'Inactiva (Expirando)' | 'Bloqueada';
}

interface UsuarioBloqueadoItem {
  id: number;
  usuario: string;
  detalle: string;
  fecha: string;
}

@Component({
  selector: 'app-seguridad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './seguridad.html',
  styleUrl: './seguridad.css',
})
export class Seguridad {
  sesionesActivas: SesionActivaItem[] = [
    {
      id: 1,
      usuario: 'admin',
      ip: '192.168.1.45',
      dispositivo: 'Chrome / Windows',
      ultimoAcceso: 'Hace 5 min',
      estado: 'Activa',
    },
    {
      id: 2,
      usuario: 'm.perez',
      ip: '192.168.1.112',
      dispositivo: 'Safari / MacOS',
      ultimoAcceso: 'Hace 12 min',
      estado: 'Activa',
    },
    {
      id: 3,
      usuario: 'cmerida',
      ip: '10.0.0.15',
      dispositivo: 'App / iOS',
      ultimoAcceso: 'Hace 2 horas',
      estado: 'Inactiva (Expirando)',
    },
  ];

  usuariosBloqueados: UsuarioBloqueadoItem[] = [
    {
      id: 1,
      usuario: 'cmerida',
      detalle: '5 intentos fallidos',
      fecha: 'Hoy 14:30',
    },
    {
      id: 2,
      usuario: 'jruiz',
      detalle: 'Bloqueo manual',
      fecha: 'Ayer 10:15',
    },
  ];

  intentosFallidos = 24;
  reseteosPassword = 8;
  tokensExpirados = 156;

  filtroSesion = '';

  tiempoSesionActiva = 480;
  jwtExpiration = 60;

  configuracionGuardada = {
    tiempoSesionActiva: 480,
    jwtExpiration: 60,
  };

  mostrarMensajeExito = false;
  mensajeExito = '';
  private notificationTimeout?: ReturnType<typeof setTimeout>;

  constructor(private router: Router) {}

  get sesionesFiltradas(): SesionActivaItem[] {
    const query = this.filtroSesion.trim().toLowerCase();

    if (!query) {
      return this.sesionesActivas;
    }

    return this.sesionesActivas.filter(
      (sesion) =>
        sesion.usuario.toLowerCase().includes(query) ||
        sesion.ip.toLowerCase().includes(query) ||
        sesion.dispositivo.toLowerCase().includes(query) ||
        sesion.estado.toLowerCase().includes(query),
    );
  }

  get totalUsuariosBloqueados(): number {
    return this.usuariosBloqueados.length;
  }

  get totalSesionesActivas(): number {
    return this.sesionesActivas.length;
  }

  get hayCambiosConfiguracion(): boolean {
    return (
      this.tiempoSesionActiva !== this.configuracionGuardada.tiempoSesionActiva ||
      this.jwtExpiration !== this.configuracionGuardada.jwtExpiration
    );
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  usuarioEstaBloqueado(usuario: string): boolean {
    return this.usuariosBloqueados.some((item) => item.usuario === usuario);
  }

  desbloquearUsuario(id: number): void {
    const usuario = this.usuariosBloqueados.find((item) => item.id === id);

    if (!usuario) {
      return;
    }

    this.usuariosBloqueados = this.usuariosBloqueados.filter((item) => item.id !== id);

    this.sesionesActivas = this.sesionesActivas.map((sesion) =>
      sesion.usuario === usuario.usuario
        ? {
            ...sesion,
            estado: 'Activa',
            ultimoAcceso: 'Hace un momento',
          }
        : sesion,
    );

    this.mostrarNotificacion(`Usuario ${usuario.usuario} desbloqueado correctamente.`);
  }

  desbloquearUsuarioPorNombre(usuario: string): void {
    const usuarioBloqueado = this.usuariosBloqueados.find((item) => item.usuario === usuario);

    if (!usuarioBloqueado) {
      this.mostrarNotificacion(`El usuario ${usuario} no está bloqueado.`);
      return;
    }

    this.desbloquearUsuario(usuarioBloqueado.id);
  }

  invalidarSesion(id: number, forzarCierre = false): void {
    const sesion = this.sesionesActivas.find((item) => item.id === id);

    if (!sesion) {
      return;
    }

    this.sesionesActivas = this.sesionesActivas.filter((item) => item.id !== id);

    this.mostrarNotificacion(
      forzarCierre
        ? `Se forzó el cierre de sesión de ${sesion.usuario}.`
        : `La sesión de ${sesion.usuario} fue invalidada.`,
    );
  }

  forzarCierreSesion(id: number): void {
    this.invalidarSesion(id, true);
  }

  restablecerPassword(usuario: string): void {
    this.reseteosPassword += 1;
    this.mostrarNotificacion(`Se inició el restablecimiento de contraseña para ${usuario}.`);
  }

  cerrarTodasSesiones(): void {
    if (!this.sesionesActivas.length) {
      this.mostrarNotificacion('No hay sesiones activas para cerrar.');
      return;
    }

    const total = this.sesionesActivas.length;
    this.sesionesActivas = [];
    this.mostrarNotificacion(`Se cerraron ${total} sesiones correctamente.`);
  }

  guardarConfiguracion(): void {
    if (this.tiempoSesionActiva <= 0 || this.jwtExpiration <= 0) {
      this.mostrarNotificacion('Los valores deben ser mayores a 0.');
      return;
    }

    this.configuracionGuardada = {
      tiempoSesionActiva: this.tiempoSesionActiva,
      jwtExpiration: this.jwtExpiration,
    };

    this.mostrarNotificacion('Configuración de seguridad guardada correctamente.');
    console.log('Configuración guardada:', this.configuracionGuardada);
  }

  private mostrarNotificacion(mensaje: string): void {
    this.mensajeExito = mensaje;
    this.mostrarMensajeExito = true;

    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }

    this.notificationTimeout = setTimeout(() => {
      this.mostrarMensajeExito = false;
      this.mensajeExito = '';
    }, 3000);
  }
}

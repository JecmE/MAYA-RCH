import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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
export class AuditoriaFuncional {
  filtroBusqueda = '';
  filtroModulo = 'Todos los módulos';
  filtroFecha = '';

  registros: AuditoriaItem[] = [
    {
      id: 1,
      fecha: '03/22/2026 08:30',
      usuario: 'm.perez',
      modulo: 'Permisos',
      accion: 'Aprobación',
      entidad: 'Solicitud #1024',
      detalle: 'Vacaciones aprobadas para Carlos Mérida'
    },
    {
      id: 2,
      fecha: '03/22/2026 09:10',
      usuario: 'admin',
      modulo: 'Usuarios',
      accion: 'Creación',
      entidad: 'Usuario ltorres',
      detalle: 'Nuevo acceso generado para supervisora'
    },
    {
      id: 3,
      fecha: '03/22/2026 10:05',
      usuario: 'rrhh',
      modulo: 'Empleados',
      accion: 'Edición',
      entidad: 'EMP-003',
      detalle: 'Actualización de puesto y departamento'
    },
    {
      id: 4,
      fecha: '03/22/2026 11:40',
      usuario: 'system',
      modulo: 'Planilla',
      accion: 'Cálculo',
      entidad: 'Período 03-2026',
      detalle: 'Revisión automática de bonos e incentivos'
    }
  ];

  constructor(private router: Router) {}

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
        this.filtroModulo === 'Todos los módulos' ||
        item.modulo === this.filtroModulo;

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
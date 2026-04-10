import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface TimesheetRegistro {
  id: number;
  empleado: string;
  proyecto: string;
  fecha: string;
  actividad: string;
  horas: number;
  estado: 'Pendiente' | 'Aprobado' | 'Observación' | 'Rechazado';
  comentario: string;
}

@Component({
  selector: 'app-timesheet-equipo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './timesheet-equipo.html',
  styleUrl: './timesheet-equipo.css',
})
export class TimesheetEquipo {
  searchTerm = '';
  selectedEstado = 'Todos los estados';
  selectedProyecto = 'Todos los proyectos';

  paginaActual = 1;
  registrosPorPagina = 5;

  registros: TimesheetRegistro[] = [
    {
      id: 1,
      empleado: 'Carlos Méndez',
      proyecto: 'CRH',
      fecha: '05/04/2026',
      actividad: 'Desarrollo de módulo de permisos',
      horas: 8,
      estado: 'Pendiente',
      comentario: 'Pendiente de validación',
    },
    {
      id: 2,
      empleado: 'Ana López',
      proyecto: 'RRHH',
      fecha: '04/04/2026',
      actividad: 'Ajuste de reportes de asistencia',
      horas: 6,
      estado: 'Aprobado',
      comentario: 'Registro validado',
    },
    {
      id: 3,
      empleado: 'Luis Herrera',
      proyecto: 'MKT',
      fecha: '03/04/2026',
      actividad: 'Corrección de interfaz de dashboard',
      horas: 7,
      estado: 'Observación',
      comentario: 'Falta detalle de actividad',
    },
    {
      id: 4,
      empleado: 'María González',
      proyecto: 'CRH',
      fecha: '02/04/2026',
      actividad: 'Pruebas de flujo de vacaciones',
      horas: 5,
      estado: 'Pendiente',
      comentario: 'Esperando aprobación',
    },
    {
      id: 5,
      empleado: 'José Ramírez',
      proyecto: 'RRHH',
      fecha: '01/04/2026',
      actividad: 'Documentación técnica',
      horas: 4,
      estado: 'Rechazado',
      comentario: 'Horas incompletas',
    },
    {
      id: 6,
      empleado: 'Sofía Castillo',
      proyecto: 'MKT',
      fecha: '31/03/2026',
      actividad: 'Integración de filtros',
      horas: 8,
      estado: 'Aprobado',
      comentario: 'Correcto',
    },
    {
      id: 7,
      empleado: 'Pedro Alvarado',
      proyecto: 'CRH',
      fecha: '30/03/2026',
      actividad: 'Actualización de API',
      horas: 7,
      estado: 'Pendiente',
      comentario: 'Revisar actividad',
    },
    {
      id: 8,
      empleado: 'Daniela Cruz',
      proyecto: 'RRHH',
      fecha: '29/03/2026',
      actividad: 'Carga de datos de empleados',
      horas: 6,
      estado: 'Observación',
      comentario: 'Agregar evidencia',
    },
    {
      id: 9,
      empleado: 'Ricardo Pérez',
      proyecto: 'MKT',
      fecha: '28/03/2026',
      actividad: 'Validación de tiempos',
      horas: 5,
      estado: 'Aprobado',
      comentario: 'Sin observaciones',
    },
    {
      id: 10,
      empleado: 'Gabriela Soto',
      proyecto: 'CRH',
      fecha: '27/03/2026',
      actividad: 'Mejoras visuales del módulo',
      horas: 8,
      estado: 'Pendiente',
      comentario: 'Pendiente de revisión',
    },
    {
      id: 11,
      empleado: 'Fernando Ruiz',
      proyecto: 'RRHH',
      fecha: '26/03/2026',
      actividad: 'Corrección de errores en login',
      horas: 4,
      estado: 'Rechazado',
      comentario: 'No coincide con marcaje',
    },
    {
      id: 12,
      empleado: 'Patricia Gómez',
      proyecto: 'MKT',
      fecha: '25/03/2026',
      actividad: 'Implementación de tabla responsive',
      horas: 7,
      estado: 'Aprobado',
      comentario: 'Registro completo',
    },
  ];

  registrosFiltrados: TimesheetRegistro[] = [...this.registros];

  constructor(private router: Router) {
    this.aplicarFiltros();
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  getStatusClass(estado: string): string {
    switch (estado) {
      case 'Pendiente':
        return 'status-pending';
      case 'Aprobado':
        return 'status-approved';
      case 'Observación':
        return 'status-observation';
      case 'Rechazado':
        return 'status-rejected';
      default:
        return '';
    }
  }

  aplicarFiltros(): void {
    const termino = this.searchTerm.trim().toLowerCase();

    this.registrosFiltrados = this.registros.filter((row) => {
      const coincideBusqueda =
        !termino ||
        row.empleado.toLowerCase().includes(termino) ||
        row.proyecto.toLowerCase().includes(termino);

      const coincideEstado =
        this.selectedEstado === 'Todos los estados' ||
        row.estado === this.selectedEstado;

      const coincideProyecto =
        this.selectedProyecto === 'Todos los proyectos' ||
        row.proyecto === this.selectedProyecto;

      return coincideBusqueda && coincideEstado && coincideProyecto;
    });

    this.paginaActual = 1;
  }

  get registrosPaginados(): TimesheetRegistro[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;
    return this.registrosFiltrados.slice(inicio, fin);
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.registrosFiltrados.length / this.registrosPorPagina));
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
    }
  }

  aprobarRegistro(id: number): void {
    const registro = this.registros.find((r) => r.id === id);
    if (registro) {
      registro.estado = 'Aprobado';
      registro.comentario = 'Registro aprobado por supervisor';
      this.aplicarFiltros();
    }
  }

  rechazarRegistro(id: number): void {
    const registro = this.registros.find((r) => r.id === id);
    if (registro) {
      registro.estado = 'Rechazado';
      registro.comentario = 'Registro rechazado por supervisor';
      this.aplicarFiltros();
    }
  }

  get totalPendientes(): number {
    return this.registros.filter((r) => r.estado === 'Pendiente').length;
  }

  get totalAprobados(): number {
    return this.registros.filter((r) => r.estado === 'Aprobado').length;
  }

  get totalObservacion(): number {
    return this.registros.filter((r) => r.estado === 'Observación').length;
  }


  limpiarFiltros(): void {
  this.searchTerm = '';
  this.selectedEstado = 'Todos los estados';
  this.selectedProyecto = 'Todos los proyectos';
  this.aplicarFiltros();
}
}
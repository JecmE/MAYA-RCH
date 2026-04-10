import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface TimesheetRow {
  id: number;
  project: string;
  date: string;
  activity: string;
  hours: string;
  status: string;
  comments: string;
}

@Component({
  selector: 'app-timesheet',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './timesheet.html',
  styleUrl: './timesheet.css',
})
export class Timesheet {
  proyecto = '';
  fecha = '';
  horas = '';
  actividad = '';

  filtroFecha = '';
  filtroProyecto = '';

  errorModal = false;
  successModal = false;

  historyData: TimesheetRow[] = [
    {
      id: 1,
      project: 'CRH',
      date: '3/22/2026',
      activity: 'Actualización...',
      hours: '4 h',
      status: 'Aprobado',
      comments: 'Horas dentro de lo establecido'
    },
    {
      id: 2,
      project: 'RRHH',
      date: '3/23/2026',
      activity: 'Revisión de permisos',
      hours: '2 h',
      status: 'Pendiente',
      comments: 'En revisión'
    },
    {
      id: 3,
      project: 'CRH',
      date: '3/24/2026',
      activity: 'Carga de datos',
      hours: '3 h',
      status: 'Aprobado',
      comments: 'Registro correcto'
    },
    {
      id: 4,
      project: 'RRHH',
      date: '3/25/2026',
      activity: 'Validación de horas',
      hours: '5 h',
      status: 'Pendiente',
      comments: 'Pendiente de revisión'
    }
  ];

  constructor(private router: Router) {}

  get historyDataFiltrada(): TimesheetRow[] {
    return this.historyData.filter((row) => {
      const proyectoFila = row.project.trim().toLowerCase();
      const proyectoFiltro = this.filtroProyecto.trim().toLowerCase();

      const coincideProyecto =
        !proyectoFiltro || proyectoFila === proyectoFiltro;

      const coincideFecha =
        !this.filtroFecha || this.convertirFecha(row.date) === this.filtroFecha;

      return coincideProyecto && coincideFecha;
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  handleValidar(): void {
    const horasNum = parseInt(this.horas, 10);

    if (!isNaN(horasNum) && horasNum > 8) {
      this.errorModal = true;
    } else if (!isNaN(horasNum) && horasNum > 0) {
      this.successModal = true;
    }
  }

  closeErrorModal(): void {
    this.errorModal = false;
  }

  closeSuccessModal(): void {
    this.successModal = false;
  }

  limpiar(): void {
    this.proyecto = '';
    this.fecha = '';
    this.horas = '';
    this.actividad = '';
  }

  limpiarFiltros(): void {
    this.filtroFecha = '';
    this.filtroProyecto = '';
  }

  private convertirFecha(fecha: string): string {
    const partes = fecha.split('/');
    if (partes.length !== 3) return '';

    const mes = partes[0].padStart(2, '0');
    const dia = partes[1].padStart(2, '0');
    const anio = partes[2];

    return `${anio}-${mes}-${dia}`;
  }
}
import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface AsistenciaGeneralItem {
  id: number;
  empleado: string;
  departamento: string;
  entrada: string;
  salida: string;
  horas: string;
  estado: string;
  observacion: string;
}

@Component({
  selector: 'app-asistencia-general',
  standalone: true,
  imports: [],
  templateUrl: './asistencia-general.html',
  styleUrl: './asistencia-general.css',
})
export class AsistenciaGeneral {
  registros: AsistenciaGeneralItem[] = [
    {
      id: 1,
      empleado: 'Carlos Mérida',
      departamento: 'RRHH',
      entrada: '7:58 AM',
      salida: '5:00 PM',
      horas: '8 h',
      estado: 'Completa',
      observacion: 'Sin novedades'
    },
    {
      id: 2,
      empleado: 'Lucía Torres',
      departamento: 'Operaciones',
      entrada: '8:12 AM',
      salida: '--:--',
      horas: '7 h',
      estado: 'Tarde',
      observacion: '12 min de retraso'
    },
    {
      id: 3,
      empleado: 'Ana López',
      departamento: 'Tecnología',
      entrada: '--:--',
      salida: '--:--',
      horas: '0 h',
      estado: 'Ausente',
      observacion: 'No registró marcaje'
    },
    {
      id: 4,
      empleado: 'Mario Paz',
      departamento: 'Tecnología',
      entrada: '8:00 AM',
      salida: '--:--',
      horas: '6.5 h',
      estado: 'Presente',
      observacion: 'Jornada en curso'
    }
  ];

  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/']);
  }

  getEstadoClass(estado: string): string {
    if (estado === 'Completa') {
      return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    }
    if (estado === 'Presente') {
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    }
    if (estado === 'Tarde') {
      return 'bg-amber-100 text-amber-800 border border-amber-200';
    }
    return 'bg-red-100 text-red-800 border border-red-200';
  }
}
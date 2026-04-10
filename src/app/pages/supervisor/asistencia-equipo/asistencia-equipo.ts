import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface AsistenciaEquipoItem {
  id: number;
  empleado: string;
  puesto: string;
  entrada: string;
  salida: string;
  horas: string;
  estado: string;
  observacion: string;
}

@Component({
  selector: 'app-asistencia-equipo',
  standalone: true,
  imports: [],
  templateUrl: './asistencia-equipo.html',
  styleUrl: './asistencia-equipo.css',
})
export class AsistenciaEquipo {
  equipoData: AsistenciaEquipoItem[] = [
    {
      id: 1,
      empleado: 'Carlos Mérida',
      puesto: 'Analista',
      entrada: '7:58 AM',
      salida: '--:--',
      horas: '7.5 h',
      estado: 'Presente',
      observacion: 'Sin novedades'
    },
    {
      id: 2,
      empleado: 'Lucía Torres',
      puesto: 'Diseñadora',
      entrada: '8:12 AM',
      salida: '--:--',
      horas: '7.0 h',
      estado: 'Tarde',
      observacion: '12 min de retraso'
    },
    {
      id: 3,
      empleado: 'Mario Paz',
      puesto: 'Desarrollador',
      entrada: '--:--',
      salida: '--:--',
      horas: '0 h',
      estado: 'Ausente',
      observacion: 'No registró marcaje'
    },
    {
      id: 4,
      empleado: 'Ana López',
      puesto: 'QA',
      entrada: '8:00 AM',
      salida: '5:00 PM',
      horas: '8 h',
      estado: 'Completa',
      observacion: 'Jornada finalizada'
    }
  ];

  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/']);
  }

getStatusClass(estado: string): string {
  switch (estado) {
    case 'Presente':
      return 'status-present';
    case 'Tarde':
      return 'status-late';
    case 'Ausente':
      return 'status-absent';
    case 'Completa':
      return 'status-complete';
    default:
      return 'status-default';
  }
}
  
}
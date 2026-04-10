import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface HistorialAsistencia {
  id: number;
  date: string;
  in: string;
  out: string;
  hours: string;
  status: string;
  obs: string;
}

@Component({
  selector: 'app-asistencia',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './asistencia.html',
  styleUrl: './asistencia.css',
})
export class Asistencia {
  fechaInicio = '';
  fechaFin = '';

  historyData: HistorialAsistencia[] = [
    { id: 1, date: '03/21/2026', in: '8:00 AM', out: '5:00 PM', hours: '8 h', status: 'Completa', obs: 'Tu jornada de hoy ya fue completada' },
    { id: 2, date: '03/20/2026', in: '8:00 AM', out: '--:--', hours: '0 h', status: 'Incompleta', obs: 'Tu jornada no fue completada' },
    { id: 3, date: '03/19/2026', in: '8:15 AM', out: '5:00 PM', hours: '7.75 h', status: 'Llegada tarde', obs: 'Retraso de 15 minutos' },
    { id: 4, date: '03/18/2026', in: '8:00 AM', out: '5:00 PM', hours: '8 h', status: 'Completa', obs: '-' },
  ];

  filteredData: HistorialAsistencia[] = [...this.historyData];

  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/']);
  }

  filtrar(): void {
    if (!this.fechaInicio && !this.fechaFin) {
      this.filteredData = [...this.historyData];
      return;
    }

    this.filteredData = this.historyData.filter((item) => {
      const itemDate = new Date(item.date);
      const start = this.fechaInicio ? new Date(this.fechaInicio) : null;
      const end = this.fechaFin ? new Date(this.fechaFin) : null;

      if (start && itemDate < start) return false;
      if (end && itemDate > end) return false;
      return true;
    });
  }

  limpiar(): void {
    this.fechaInicio = '';
    this.fechaFin = '';
    this.filteredData = [...this.historyData];
  }

  getStatusClass(status: string): string {
    if (status === 'Completa') {
      return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    }
    if (status === 'Incompleta') {
      return 'bg-red-100 text-red-800 border border-red-200';
    }
    return 'bg-amber-100 text-amber-800 border border-amber-200';
  }
}
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AttendanceService, AttendanceRecord } from '../../../services/attendance.service';

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
export class AsistenciaGeneral implements OnInit {
  registros: AsistenciaGeneralItem[] = [];

  constructor(
    private router: Router,
    private attendanceService: AttendanceService,
  ) {}

  ngOnInit(): void {
    this.loadAttendanceData();
  }

  private loadAttendanceData(): void {
    const hoy = new Date().toISOString().split('T')[0];
    this.attendanceService.getHistory(hoy, hoy).subscribe({
      next: (data: AttendanceRecord[]) => {
        this.registros = data.map((record, index) => this.mapAttendanceToItem(record, index));
      },
      error: () => {
        this.registros = [];
      },
    });
  }

  private mapAttendanceToItem(record: AttendanceRecord, index: number): AsistenciaGeneralItem {
    return {
      id: record.asistenciaId ?? index,
      empleado: `Empleado ${record.empleadoId}`,
      departamento: 'General',
      entrada: record.horaEntradaReal || '--:--',
      salida: record.horaSalidaReal || '--:--',
      horas: record.horasTrabajadas ? `${record.horasTrabajadas} h` : '0 h',
      estado: this.getEstadoFromRecord(record),
      observacion: record.observacion || 'Sin novedades',
    };
  }

  private getEstadoFromRecord(record: AttendanceRecord): string {
    if (!record.horaEntradaReal) return 'Ausente';
    if (record.minutosTardia && record.minutosTardia > 0) return 'Tarde';
    if (record.horaSalidaReal) return 'Completa';
    return 'Presente';
  }

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

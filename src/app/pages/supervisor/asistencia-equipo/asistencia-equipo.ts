import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AttendanceService, TeamAttendance } from '../../../services/attendance.service';

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
export class AsistenciaEquipo implements OnInit {
  equipoData: AsistenciaEquipoItem[] = [];

  constructor(
    private router: Router,
    private attendanceService: AttendanceService,
  ) {}

  ngOnInit(): void {
    this.loadTeamAttendance();
  }

  private loadTeamAttendance(): void {
    const supervisorId = this.getSupervisorId();
    if (!supervisorId) {
      this.equipoData = [];
      return;
    }

    const hoy = new Date().toISOString().split('T')[0];

    this.attendanceService.getTeamAttendance(supervisorId, hoy).subscribe({
      next: (data: TeamAttendance[]) => {
        this.equipoData = data.map((member) => this.mapTeamAttendanceToItem(member));
      },
      error: () => {
        this.equipoData = [];
      },
    });
  }

  private getSupervisorId(): number | null {
    const empleadoIdStr = localStorage.getItem('empleadoId');
    return empleadoIdStr ? parseInt(empleadoIdStr, 10) : null;
  }

  private mapTeamAttendanceToItem(member: TeamAttendance): AsistenciaEquipoItem {
    const attendance = member.asistencia;
    return {
      id: member.empleadoId,
      empleado: member.nombreCompleto || `Empleado ${member.empleadoId}`,
      puesto: member.departamento || 'Empleado',
      entrada: attendance?.horaEntradaReal || '--:--',
      salida: attendance?.horaSalidaReal || '--:--',
      horas: attendance?.horasTrabajadas ? `${attendance.horasTrabajadas} h` : '0 h',
      estado: this.getEstadoFromAttendance(attendance),
      observacion: attendance?.observacion || 'Sin novedades',
    };
  }

  private getEstadoFromAttendance(attendance: any): string {
    if (!attendance?.horaEntradaReal) return 'Ausente';
    if (attendance.minutosTardia && attendance.minutosTardia > 0) return 'Tarde';
    if (attendance.horaSalidaReal) return 'Completa';
    return 'Presente';
  }

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

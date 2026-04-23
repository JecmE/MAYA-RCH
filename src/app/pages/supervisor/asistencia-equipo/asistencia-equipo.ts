import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, FormsModule],
  templateUrl: './asistencia-equipo.html',
  styleUrl: './asistencia-equipo.css',
})
export class AsistenciaEquipo implements OnInit {
  searchTerm = '';
  filterDate = new Date().toISOString().split('T')[0];

  equipoData: AsistenciaEquipoItem[] = [];
  filteredData: AsistenciaEquipoItem[] = [];

  constructor(
    private router: Router,
    private attendanceService: AttendanceService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTeamAttendance();
  }

  loadTeamAttendance(): void {
    const supervisorId = this.getSupervisorId();
    if (!supervisorId) {
      this.equipoData = [];
      this.filteredData = [];
      return;
    }

    this.attendanceService.getTeamAttendance(supervisorId, this.filterDate).subscribe({
      next: (data: TeamAttendance[]) => {
        this.equipoData = data.map((member) => this.mapTeamAttendanceToItem(member));
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: () => {
        this.equipoData = [];
        this.filteredData = [];
        this.cdr.detectChanges();
      },
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredData = this.equipoData.filter(item =>
      !term || item.empleado.toLowerCase().includes(term)
    );
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
      puesto: member.puesto || 'Empleado',
      entrada: attendance?.horaEntradaReal ? this.formatTime(attendance.horaEntradaReal) : '--:--',
      salida: attendance?.horaSalidaReal ? this.formatTime(attendance.horaSalidaReal) : '--:--',
      horas: attendance?.horasTrabajadas ? `${attendance.horasTrabajadas} h` : '0 h',
      estado: this.getEstadoFromAttendance(attendance),
      observacion: attendance?.observacion || 'Sin marcaje',
    };
  }

  private formatTime(time: string): string {
    if (!time) return '--:--';
    const d = new Date(time);
    return d.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
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
      case 'Presente': return 'status-present';
      case 'Tarde': return 'status-late';
      case 'Ausente': return 'status-absent';
      case 'Completa': return 'status-complete';
      default: return 'status-default';
    }
  }

  get stats() {
    return {
      presentes: this.equipoData.filter(d => d.estado === 'Presente').length,
      tardias: this.equipoData.filter(d => d.estado === 'Tarde').length,
      ausentes: this.equipoData.filter(d => d.estado === 'Ausente').length,
      completas: this.equipoData.filter(d => d.estado === 'Completa').length
    };
  }
}

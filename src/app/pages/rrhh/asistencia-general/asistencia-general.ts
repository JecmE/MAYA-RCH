import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AttendanceService } from '../../../services/attendance.service';

interface AsistenciaGlobalItem {
  id: number;
  empleado: string;
  codigo: string;
  departamento: string;
  turno: string;
  entrada: string;
  salida: string;
  estado: string;
  tardia: string;
  observacion: string;
}

@Component({
  selector: 'app-asistencia-general',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asistencia-general.html',
  styleUrl: './asistencia-general.css',
})
export class AsistenciaGeneral implements OnInit {
  fechaFiltro = new Date().toISOString().split('T')[0];
  filtroBusqueda = '';
  filtroDepartamento = 'Todos';

  registros: AsistenciaGlobalItem[] = [];
  stats = { presentes: 0, tardias: 0, ausentes: 0 };

  constructor(
    private router: Router,
    private attendanceService: AttendanceService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAttendance();
  }

  loadAttendance(): void {
    this.attendanceService.getAllAttendance(this.fechaFiltro).subscribe({
      next: (data) => {
        this.registros = data.map(item => this.mapToItem(item));
        this.calculateStats();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando asistencia global:', err);
        this.registros = [];
      }
    });
  }

  private mapToItem(item: any): AsistenciaGlobalItem {
    const a = item.asistencia;
    return {
      id: item.empleadoId,
      empleado: item.nombreCompleto,
      codigo: item.codigoEmpleado,
      departamento: item.departamento,
      turno: item.turno,
      entrada: a?.horaEntradaReal ? this.formatTime(a.horaEntradaReal) : '--:--',
      salida: a?.horaSalidaReal ? this.formatTime(a.horaSalidaReal) : '--:--',
      estado: this.calcEstado(a),
      tardia: a?.minutosTardia > 0 ? `${a.minutosTardia} min` : '-',
      observacion: a?.observacion || '-'
    };
  }

  private formatTime(time: string): string {
    const d = new Date(time);
    return d.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
  }

  private calcEstado(a: any): string {
    if (!a) return 'Ausente';
    if (a.minutosTardia > 0) return 'Tarde';
    if (a.horaSalidaReal) return 'Completado';
    return 'Presente';
  }

  private calculateStats(): void {
    this.stats.presentes = this.registros.filter(r => r.estado !== 'Ausente').length;
    this.stats.tardias = this.registros.filter(r => r.estado === 'Tarde').length;
    this.stats.ausentes = this.registros.filter(r => r.estado === 'Ausente').length;
  }

  get dataFiltrada(): AsistenciaGlobalItem[] {
    return this.registros.filter(r => {
      const matchBusqueda = !this.filtroBusqueda ||
                            r.empleado.toLowerCase().includes(this.filtroBusqueda.toLowerCase()) ||
                            r.codigo.toLowerCase().includes(this.filtroBusqueda.toLowerCase());
      const matchDep = this.filtroDepartamento === 'Todos' || r.departamento === this.filtroDepartamento;
      return matchBusqueda && matchDep;
    });
  }

  get departamentos(): string[] {
    const deps = new Set(this.registros.map(r => r.departamento));
    return Array.from(deps).sort();
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'Completado': return 'badge--green';
      case 'Presente': return 'badge--blue';
      case 'Tarde': return 'badge--amber';
      default: return 'badge--red';
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}

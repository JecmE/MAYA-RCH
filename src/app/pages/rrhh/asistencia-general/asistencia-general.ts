import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AttendanceService } from '../../../services/attendance.service';
import jsPDF from 'jspdf';

interface AsistenciaGlobalItem {
  id: number;
  asistenciaId?: number;
  empleado: string;
  codigo: string;
  departamento: string;
  fecha: string;
  turno: string;
  entrada: string;
  salida: string;
  estado: string;
  tardia: string;
  horas: string;
  observacion: string;
}

interface AjusteForm {
  asistenciaId: number;
  empleadoId: number;
  empleado: string;
  fecha: string;
  fechaISO: string;
  campo: string;
  valorAnterior: string;
  valorNuevo: string;
  motivo: string;
  entradaActual: string;
  salidaActual: string;
}

@Component({
  selector: 'app-asistencia-general',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asistencia-general.html',
  styleUrl: './asistencia-general.css',
})
export class AsistenciaGeneral implements OnInit {
  tab: 'asistencia' | 'historial' = 'asistencia';
  fechaInicio = this.getLocalDateString();
  fechaFin = this.getLocalDateString();
  filtroBusqueda = '';
  filtroDepartamento = 'Todos';
  filtroEstado = 'Todos';

  registros: AsistenciaGlobalItem[] = [];
  historialAjustes: any[] = [];
  stats = { presentes: 0, tardias: 0, ausentes: 0 };

  modalAjuste = false;
  isSaving = false;
  ajusteForm: AjusteForm = this.limpiarAjusteForm();

  constructor(
    private router: Router,
    private attendanceService: AttendanceService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAttendance();
  }

  private getLocalDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  setTab(tab: 'asistencia' | 'historial'): void {
    this.tab = tab;
    if (tab === 'historial') {
      this.loadAdjustmentHistory();
    }
  }

  loadAttendance(): void {
    this.attendanceService.getAllAttendance(this.fechaInicio, this.fechaFin).subscribe({
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

  loadAdjustmentHistory(): void {
    this.attendanceService.getAdjustmentHistory().subscribe({
      next: (data) => {
        this.historialAjustes = data;
        this.cdr.detectChanges();
      }
    });
  }

  private mapToItem(item: any): AsistenciaGlobalItem {
    const a = item.asistencia;
    return {
      id: item.empleadoId,
      asistenciaId: a?.asistenciaId,
      empleado: item.nombreCompleto,
      codigo: item.codigoEmpleado,
      departamento: item.departamento,
      fecha: this.formatDateDisplay(item.fecha),
      turno: item.turno,
      entrada: a?.horaEntradaReal ? this.formatTime(a.horaEntradaReal) : '--:--',
      salida: a?.horaSalidaReal ? this.formatTime(a.horaSalidaReal) : '--:--',
      estado: this.calcEstado(a),
      tardia: a?.minutosTardia > 0 ? `${a.minutosTardia} min` : '-',
      horas: a?.horasTrabajadas ? `${a.horasTrabajadas} h` : '0 h',
      observacion: a?.observacion || '-'
    };
  }

  private formatTime(time: string): string {
    const d = new Date(time);
    return d.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
  }

  private formatDateDisplay(dateInput: any): string {
    const d = new Date(dateInput);
    const userTimezoneOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() + userTimezoneOffset).toLocaleDateString('es-GT');
  }

  private calcEstado(a: any): string {
    if (!a) return 'Ausente';
    if (a.horaSalidaReal) return 'Completado';
    if (a.minutosTardia > 0) return 'Tarde';
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
      const matchEstado = this.filtroEstado === 'Todos' || r.estado === this.filtroEstado;
      return matchBusqueda && matchDep && matchEstado;
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

  abrirAjuste(row: AsistenciaGlobalItem): void {
    const parts = row.fecha.split('/');
    const fechaISO = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;

    this.ajusteForm = {
      asistenciaId: row.asistenciaId || 0,
      empleadoId: row.id,
      empleado: row.empleado,
      fecha: row.fecha,
      fechaISO: fechaISO,
      campo: 'horaEntradaReal',
      entradaActual: row.entrada === '--:--' ? 'Sin registro' : row.entrada,
      salidaActual: row.salida === '--:--' ? 'Sin registro' : row.salida,
      valorAnterior: '',
      valorNuevo: '',
      motivo: ''
    };
    this.onCampoChange();
    this.modalAjuste = true;
  }

  onCampoChange(): void {
    if (this.ajusteForm.campo === 'horaEntradaReal') {
      this.ajusteForm.valorAnterior = this.ajusteForm.entradaActual;
    } else {
      this.ajusteForm.valorAnterior = this.ajusteForm.salidaActual;
    }
    this.cdr.detectChanges();
  }

  guardarAjuste(): void {
    if (!this.ajusteForm.valorNuevo || !this.ajusteForm.motivo) {
      alert('Complete el nuevo valor y el motivo obligatorio del ajuste.');
      return;
    }

    this.isSaving = true;
    const payload = {
      campo: this.ajusteForm.campo,
      valorAnterior: this.ajusteForm.valorAnterior,
      valorNuevo: this.ajusteForm.valorNuevo,
      motivo: this.ajusteForm.motivo,
      empleadoId: this.ajusteForm.empleadoId,
      fecha: this.ajusteForm.fechaISO
    };

    this.attendanceService.adjustAttendance(this.ajusteForm.asistenciaId, payload).subscribe({
      next: () => {
        this.isSaving = false;
        alert('Ajuste aplicado correctamente.');
        this.modalAjuste = false;
        this.loadAttendance();
      },
      error: (err) => {
        this.isSaving = false;
        alert(err.error?.message || 'Error al aplicar ajuste');
      }
    });
  }

  limpiarAjusteForm(): AjusteForm {
    return { asistenciaId: 0, empleadoId: 0, empleado: '', fecha: '', fechaISO: '', campo: '', valorAnterior: '', valorNuevo: '', motivo: '', entradaActual: '', salidaActual: '' };
  }

  exportExcel(): void {
    if (this.dataFiltrada.length === 0) return;
    const headers = ['Fecha', 'Colaborador', 'Código', 'Departamento', 'Turno', 'Entrada', 'Salida', 'Horas', 'Estado', 'Observaciones'];
    let csvContent = headers.join(",") + "\r\n";
    this.dataFiltrada.forEach(r => {
      csvContent += `"${r.fecha}","${r.empleado}","${r.codigo}","${r.departamento}","${r.turno}","${r.entrada}","${r.salida}","${r.horas}","${r.estado}","${r.observacion}"\r\n`;
    });
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Asistencia_General.csv`;
    link.click();
  }

  exportPdf(): void {
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.text('Reporte de Asistencia General', 14, 20);
    doc.save('Asistencia_General.pdf');
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}

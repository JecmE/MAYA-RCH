import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AttendanceService, AttendanceRecord } from '../../services/attendance.service';

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
export class Asistencia implements OnInit {
  fechaInicio = '';
  fechaFin = '';

  historyData: HistorialAsistencia[] = [];
  filteredData: HistorialAsistencia[] = [];

  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  constructor(
    private router: Router,
    private attendanceService: AttendanceService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  private loadHistory(): void {
    this.attendanceService.getHistory().subscribe({
      next: (records: AttendanceRecord[]) => {
        this.historyData = records.map((r, index) => this.mapToHistorial(r, index));
        this.filteredData = [...this.historyData];
        this.updatePagination();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando historial:', err);
        this.historyData = [];
        this.filteredData = [];
        this.updatePagination();
        this.cdr.detectChanges();
      },
    });
  }

  private mapToHistorial(r: AttendanceRecord, index: number): HistorialAsistencia {
    return {
      id: r.asistenciaId || index + 1,
      date: r.fecha ? new Date(r.fecha).toLocaleDateString('en-US') : '',
      in: r.horaEntradaReal ? this.formatTime(r.horaEntradaReal) : '--:--',
      out: r.horaSalidaReal ? this.formatTime(r.horaSalidaReal) : '--:--',
      hours: r.horasTrabajadas ? `${r.horasTrabajadas} h` : '0 h',
      status: this.getStatusFromRecord(r),
      obs:
        r.observacion ||
        (r.minutosTardia && r.minutosTardia > 0
          ? `Retraso de ${r.minutosTardia} minutos`
          : 'Sin novedades'),
    };
  }

  private formatTime(time: string): string {
    if (!time) return '--:--';
    if (time.includes('T')) {
      return new Date(time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return time.substring(0, 5);
  }

  private getStatusFromRecord(r: AttendanceRecord): string {
    if (r.estadoJornada === 'completada') return 'Completa';
    if (r.estadoJornada === 'incompleta') return 'Incompleta';
    if (r.minutosTardia && r.minutosTardia > 0) return 'Llegada tarde';
    return 'Pendiente';
  }

  private updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredData.length / this.pageSize) || 1;
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
  }

  get paginatedData(): HistorialAsistencia[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredData.slice(start, end);
  }

  get showingStart(): number {
    if (this.filteredData.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get showingEnd(): number {
    const end = this.currentPage * this.pageSize;
    return Math.min(end, this.filteredData.length);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  filtrar(): void {
    if (!this.fechaInicio && !this.fechaFin) {
      this.filteredData = [];
      this.updatePagination();
      this.cdr.detectChanges();
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
    this.currentPage = 1;
    this.updatePagination();
    this.cdr.detectChanges();
  }

  limpiar(): void {
    this.fechaInicio = '';
    this.fechaFin = '';
    this.filteredData = [];
    this.currentPage = 1;
    this.updatePagination();
    this.cdr.detectChanges();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.cdr.detectChanges();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.cdr.detectChanges();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.cdr.detectChanges();
    }
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

  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }
}

import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ReportsService,
} from '../../../services/reports.service';
import { ProjectsService } from '../../../services/projects.service';
import jsPDF from 'jspdf';

interface ReporteDisponibleItem {
  id: number;
  nombre: string;
  descripcion: string;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css',
})
export class Reportes implements OnInit {
  tipoReporteSeleccionado = '';
  fechaDesde = this.getStartOfMonth();
  fechaHasta = this.getTodayISO();
  departamentoSeleccionado = 'Todos';
  proyectoSeleccionado = 'Todos los proyectos';
  proyectosList: string[] = ['Todos los proyectos'];
  departamentos: string[] = ['Todos'];

  vistaPreviaGenerada = false;
  reporteVistaPrevia: ReporteDisponibleItem | null = null;

  isLoading = false;
  dataPreview: any[] = [];
  headersPreview: string[] = [];

  mostrarMensajeExito = false;
  mensajeExito = '';

  reportesDisponibles: ReporteDisponibleItem[] = [
    { id: 1, nombre: 'Asistencia y Tardías', descripcion: 'Resumen detallado de marcas y horas.' },
    { id: 2, nombre: 'Saldos de Vacaciones', descripcion: 'Días disponibles y usados por período.' },
    { id: 3, nombre: 'Horas por Proyecto', descripcion: 'Distribución de tiempos asignados.' },
    { id: 4, nombre: 'Elegibilidad a Bonos', descripcion: 'Resultados de cumplimiento para incentivos.' },
  ];

  constructor(
    private router: Router,
    private reportsService: ReportsService,
    private projectsService: ProjectsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    this.reportsService.getDepartments().subscribe(data => {
      this.departamentos = ['Todos', ...data];
      this.cdr.detectChanges();
    });

    this.projectsService.getAll().subscribe(data => {
      this.proyectosList = ['Todos los proyectos', ...data.map(p => p.nombre)];
      this.cdr.detectChanges();
    });
  }

  generarVistaPrevia(): void {
    if (!this.tipoReporteSeleccionado) return;

    const rep = this.reportesDisponibles.find(r => r.nombre === this.tipoReporteSeleccionado);
    this.reporteVistaPrevia = rep || null;
    this.isLoading = true;
    this.vistaPreviaGenerada = true;
    this.dataPreview = [];

    if (rep?.id === 1) { // Asistencia
      this.headersPreview = ['Empleado', 'Dep.', 'Días Asis.', 'Tardías', 'Horas Totales'];
      this.reportsService.getMonthlyAttendance(this.fechaDesde, this.fechaHasta, this.departamentoSeleccionado).subscribe({
        next: (data) => {
          const mapped = data.map(r => [r.nombreCompleto, r.departamento, r.diasAsistidos, r.tardias, (r.horasTrabajadasTotal || 0) + 'h']);
          const totalHours = data.reduce((sum, r) => sum + Number(r.horasTrabajadasTotal || 0), 0);
          mapped.push(['TOTAL GENERAL', '-', '-', '-', totalHours.toFixed(1) + 'h']);
          this.dataPreview = mapped;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: () => this.isLoading = false
      });
    } else if (rep?.id === 2) { // Vacaciones
      this.headersPreview = ['Empleado', 'Departamento', 'Disponibles', 'Usados en Rango', 'Total Acum.'];
      this.reportsService.getVacationBalances(this.fechaDesde, this.fechaHasta, this.departamentoSeleccionado, 'Todos los proyectos').subscribe({
        next: (data) => {
          this.dataPreview = data.map(r => [r.nombreCompleto, r.departamento, r.diasDisponibles, r.diasUsados, r.totalAcumulado]);
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: () => this.isLoading = false
      });
    } else if (rep?.id === 3) { // Proyectos
      this.headersPreview = ['Proyecto', 'Código', 'Empleado', 'Horas'];
      this.reportsService.getProjectHours(this.fechaDesde, this.fechaHasta, 'Todos', this.proyectoSeleccionado).subscribe({
        next: (data) => {
          const mapped = data.map(r => [r.proyectoNombre, r.proyectoCodigo, r.nombreEmpleado, (r.horasTotales || 0) + 'h']);
          const totalHours = data.reduce((sum, r) => sum + Number(r.horasTotales || 0), 0);
          if (mapped.length > 0) {
            mapped.push(['TOTAL PROYECTO', '-', '-', totalHours.toFixed(2) + 'h']);
          }
          this.dataPreview = mapped;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: () => this.isLoading = false
      });
    } else if (rep?.id === 4) { // Bonos (USA RANGO)
      this.headersPreview = ['Empleado', 'Dep.', 'Cumplimiento', 'Estado', 'Monto'];
      this.reportsService.getBonusEligibilityRange(this.fechaDesde, this.fechaHasta, this.departamentoSeleccionado).subscribe({
        next: (data) => {
          this.dataPreview = data.map(r => [
            r.nombreCompleto,
            r.departamento,
            Number(r.cumplimientoPct).toFixed(1) + '%',
            r.elegible ? 'Elegible' : 'No elegible',
            'Q' + Number(r.monto || 0).toLocaleString('es-GT', {minimumFractionDigits: 2})
          ]);
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: () => this.isLoading = false
      });
    }
  }

  exportarExcel(): void {
    if (this.dataPreview.length === 0) return;
    let csv = this.headersPreview.join(",") + "\r\n";
    this.dataPreview.forEach(row => {
      csv += row.map((v:any) => `"${v}"`).join(",") + "\r\n";
    });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Reporte_${this.tipoReporteSeleccionado.replace(/\s/g, '_')}.csv`;
    link.click();
    this.mostrarNotificacion('Reporte Excel generado.');
  }

  exportarPdf(): void {
    if (this.dataPreview.length === 0) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`MAYA RCH - ${this.tipoReporteSeleccionado}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Filtros: ${this.departamentoSeleccionado} | ${this.fechaDesde} al ${this.fechaHasta}`, 14, 28);

    let y = 40;
    doc.setFontSize(8);
    this.headersPreview.forEach((h, i) => doc.text(h, 14 + (i * 38), y));
    y += 5;
    doc.line(14, y, 196, y);
    y += 8;

    this.dataPreview.forEach(row => {
      if (y > 270) { doc.addPage(); y = 20; }
      row.forEach((cell:any, i:number) => {
        if (String(row[0]).includes('TOTAL')) doc.setFont("helvetica", "bold");
        else doc.setFont("helvetica", "normal");
        doc.text(String(cell), 14 + (i * 38), y);
      });
      y += 8;
    });

    doc.save(`Reporte_${this.tipoReporteSeleccionado.replace(/\s/g, '_')}.pdf`);
    this.mostrarNotificacion('Reporte PDF generado.');
  }

  private getTodayISO(): string { return new Date().toISOString().split('T')[0]; }
  private getStartOfMonth(): string {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  }

  private mostrarNotificacion(mensaje: string): void {
    this.mensajeExito = mensaje;
    this.mostrarMensajeExito = true;
    setTimeout(() => this.mostrarMensajeExito = false, 3000);
  }

  goBack(): void { this.router.navigate(['/']); }
}

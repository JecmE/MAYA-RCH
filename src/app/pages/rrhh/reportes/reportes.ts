import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ReportsService,
  MonthlyAttendanceReport,
  ProjectHoursReport,
} from '../../../services/reports.service';

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
  fechaDesde = '';
  fechaHasta = '';
  departamentoSeleccionado = 'Todos';
  proyectoSeleccionado = 'Todos los proyectos';

  vistaPreviaGenerada = false;
  reporteVistaPrevia: ReporteDisponibleItem | null = null;

  mostrarMensajeExito = false;
  mensajeExito = '';

  reportesDisponibles: ReporteDisponibleItem[] = [
    {
      id: 1,
      nombre: 'Asistencia y Tardías',
      descripcion: 'Reporte detallado de marcas, horas trabajadas y anomalías por período.',
    },
    {
      id: 2,
      nombre: 'Permisos y Vacaciones',
      descripcion: 'Saldos actuales e histórico de ausencias justificadas.',
    },
    {
      id: 3,
      nombre: 'Horas por Proyecto',
      descripcion: 'Distribución de horas trabajadas según asignación de proyectos en timesheet.',
    },
    {
      id: 4,
      nombre: 'KPIs Globales',
      descripcion: 'Métricas de cumplimiento general, rotación y desempeño de asistencia.',
    },
    {
      id: 5,
      nombre: 'Nómina y Planilla',
      descripcion: 'Consolidado para envío a pago, incluye percepciones y deducciones.',
    },
  ];

  departamentos = ['Todos', 'Tecnología', 'Marketing', 'Recursos Humanos', 'Finanzas'];

  proyectos: string[] = ['Todos los proyectos'];

  private projectHoursData: ProjectHoursReport[] = [];

  constructor(
    private router: Router,
    private reportsService: ReportsService,
  ) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  private loadProjects(): void {
    const hoy = new Date();
    const fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
    const fechaFin = hoy.toISOString().split('T')[0];

    this.reportsService.getProjectHours(1, fechaInicio, fechaFin).subscribe({
      next: (data: ProjectHoursReport[]) => {
        this.projectHoursData = data;
        const projectNames = [...new Set(data.map((p) => p.proyectoNombre))];
        this.proyectos = ['Todos los proyectos', ...projectNames];
      },
      error: () => {
        this.proyectos = ['Todos los proyectos'];
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  generarVistaPrevia(): void {
    const reporteSeleccionado = this.reportesDisponibles.find(
      (item) => item.nombre === this.tipoReporteSeleccionado,
    );

    this.reporteVistaPrevia = reporteSeleccionado || null;
    this.vistaPreviaGenerada = true;
  }

  exportarExcel(): void {
    if (!this.reporteVistaPrevia) {
      return;
    }

    this.mostrarNotificacion(`El reporte "${this.reporteVistaPrevia.nombre}" se exportó en Excel.`);
    console.log(`Exportando ${this.reporteVistaPrevia.nombre} a Excel`);
  }

  exportarPdf(): void {
    if (!this.reporteVistaPrevia) {
      return;
    }

    this.mostrarNotificacion(`El reporte "${this.reporteVistaPrevia.nombre}" se exportó en PDF.`);
    console.log(`Exportando ${this.reporteVistaPrevia.nombre} a PDF`);
  }

  private mostrarNotificacion(mensaje: string): void {
    this.mensajeExito = mensaje;
    this.mostrarMensajeExito = true;

    setTimeout(() => {
      this.mostrarMensajeExito = false;
      this.mensajeExito = '';
    }, 3000);
  }
}

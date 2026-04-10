import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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
export class Reportes {
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
      descripcion: 'Reporte detallado de marcas, horas trabajadas y anomalías por período.'
    },
    {
      id: 2,
      nombre: 'Permisos y Vacaciones',
      descripcion: 'Saldos actuales e histórico de ausencias justificadas.'
    },
    {
      id: 3,
      nombre: 'Horas por Proyecto',
      descripcion: 'Distribución de horas trabajadas según asignación de proyectos en timesheet.'
    },
    {
      id: 4,
      nombre: 'KPIs Globales',
      descripcion: 'Métricas de cumplimiento general, rotación y desempeño de asistencia.'
    },
    {
      id: 5,
      nombre: 'Nómina y Planilla',
      descripcion: 'Consolidado para envío a pago, incluye percepciones y deducciones.'
    }
  ];

  departamentos = [
    'Todos',
    'Tecnología',
    'Marketing',
    'Recursos Humanos',
    'Finanzas'
  ];

  proyectos = [
    'Todos los proyectos',
    'Rediseño Web',
    'Campaña Navideña',
    'Migración DB',
    'Auditoría Anual'
  ];

  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/']);
  }

  generarVistaPrevia(): void {
    const reporteSeleccionado = this.reportesDisponibles.find(
      (item) => item.nombre === this.tipoReporteSeleccionado
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
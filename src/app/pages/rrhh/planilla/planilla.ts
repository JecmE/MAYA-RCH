import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PayrollService, PayrollResult, PeriodoPlanilla } from '../../../services/payroll.service';
import jsPDF from 'jspdf';

interface PlanillaEmpleadoItem {
  id: number;
  empleado: string;
  puesto: string;
  salarioBase: string;
  bonificacion: string;
  deducciones: string;
  neto: string;
  estado: string;
}

@Component({
  selector: 'app-planilla',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './planilla.html',
  styleUrl: './planilla.css',
})
export class Planilla implements OnInit {
  periodoId: number | null = null;
  periodosDisponibles: PeriodoPlanilla[] = [];
  tipoPlanilla = 'mensual';

  filtroBusqueda = '';
  filtroEstado = 'Todos los estados';

  mostrarMensajeExito = false;
  mensajeExito = '';
  isCalculating = false;

  modalBoleta = false;
  empleadoSeleccionado: PlanillaEmpleadoItem | null = null;

  planillaData: PlanillaEmpleadoItem[] = [];

  constructor(
    private router: Router,
    private payrollService: PayrollService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPeriods();
  }

  private loadPeriods(): void {
    this.payrollService.getPeriods().subscribe({
      next: (periods) => {
        this.periodosDisponibles = periods;
        if (periods.length > 0) {
          this.periodoId = periods[0].periodoId || null;
          this.loadPayrollResults();
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando periodos:', err)
    });
  }

  loadPayrollResults(): void {
    if (!this.periodoId) return;

    this.isCalculating = true;
    this.payrollService.calculatePayroll(this.periodoId).subscribe({
      next: (data: any) => {
        this.isCalculating = false;
        if (data && data.resultados) {
          this.planillaData = data.resultados.map((p: PayrollResult) => this.mapPayrollToItem(p));
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isCalculating = false;
        this.planillaData = [];
        this.cdr.detectChanges();
      }
    });
  }

  private mapPayrollToItem(p: PayrollResult): PlanillaEmpleadoItem {
    return {
      id: p.empleadoId,
      empleado: this.sanitize(p.nombreCompleto) || `Empleado ${p.empleadoId}`,
      puesto: 'Colaborador',
      salarioBase: this.formatearMoneda(p.montoBruto),
      bonificacion: this.formatearMoneda(p.totalBonificaciones),
      deducciones: this.formatearMoneda(p.totalDeducciones),
      neto: this.formatearMoneda(p.montoNeto),
      estado: 'Calculado',
    };
  }

  private sanitize(str: string | undefined | null): string {
    if (!str) return '';

    // Corregir caracteres rotos
    let res = str.replace(/Ã­/g, 'í').replace(/Ã³/g, 'ó').replace(/Ã¡/g, 'á')
                 .replace(/Ã©/g, 'é').replace(/Ãº/g, 'ú').replace(/Ã±/g, 'ñ').replace(/Ã/g, 'í');

    // Corregir signos ?
    res = res.replace(/\?/g, (m, offset, original) => {
      if (original.includes('Rodr')) return 'í';
      if (original.includes('Mart')) return 'í';
      if (original.includes('Garc')) return 'í';
      if (original.includes('Fern')) return 'á';
      return 'í';
    });

    // Eliminar palabras duplicadas (ej: María José María José)
    const words = res.split(' ');
    const seen = new Set<string>();
    return words.filter(w => {
      const lower = w.toLowerCase();
      if (seen.has(lower) && w.length > 2) return false;
      seen.add(lower);
      return true;
    }).join(' ');
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  generarPlanilla(): void {
    if (!this.periodoId) return;
    this.loadPayrollResults();
  }

  limpiarFiltros(): void {
    this.filtroBusqueda = '';
    this.filtroEstado = 'Todos los estados';
  }

  verBoleta(empleado: PlanillaEmpleadoItem): void {
    this.empleadoSeleccionado = empleado;
    this.modalBoleta = true;
  }

  cerrarModalBoleta(): void {
    this.modalBoleta = false;
    this.empleadoSeleccionado = null;
  }

  recalcularEmpleado(empleado: PlanillaEmpleadoItem): void {
    this.generarPlanilla();
  }

  exportarExcel(): void {
    if (this.planillaData.length === 0) return;

    const headers = ['Colaborador', 'Sueldo Bruto', 'Bonificaciones', 'Deducciones', 'Sueldo Neto'];
    const cleanNum = (val: string) => val.replace('Q', '').replace(/,/g, '').trim();

    const rows = this.planillaFiltrada.map(p => [
      p.empleado,
      cleanNum(p.salarioBase),
      cleanNum(p.bonificacion),
      cleanNum(p.deducciones),
      cleanNum(p.neto)
    ]);

    // Usar coma y comillas dobles (estándar CSV universal)
    let csvContent = headers.map(h => `"${h}"`).join(",") + "\r\n";
    rows.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(",") + "\r\n";
    });

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Planilla_${this.obtenerNombrePeriodo().replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.mostrarNotificacion('Archivo Excel generado con éxito.');
  }

  exportarPdf(): void {
    if (this.planillaData.length === 0) return;
    const doc = new jsPDF();
    const periodName = this.obtenerNombrePeriodo();
    doc.setFontSize(18);
    doc.text(`Reporte de Planilla - ${periodName}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 14, 28);

    let y = 45;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Colaborador", 14, y);
    doc.text("Bruto", 80, y);
    doc.text("Bonos", 110, y);
    doc.text("Deducciones", 140, y);
    doc.text("Neto", 170, y);
    doc.line(14, y + 2, 195, y + 2);
    y += 10;

    doc.setFont("helvetica", "normal");
    this.planillaFiltrada.forEach(item => {
      doc.text(item.empleado, 14, y);
      doc.text(item.salarioBase, 80, y);
      doc.text(item.bonificacion, 110, y);
      doc.text(item.deducciones, 140, y);
      doc.text(item.neto, 170, y);
      y += 8;
    });

    doc.save(`Planilla_${periodName.replace(/\s+/g, '_')}.pdf`);
  }

  get planillaFiltrada(): PlanillaEmpleadoItem[] {
    const texto = this.filtroBusqueda.trim().toLowerCase();
    return this.planillaData.filter((e) => !texto || e.empleado.toLowerCase().includes(texto));
  }

  get totalColaboradores(): number { return this.planillaData.length; }
  get totalDevengado(): string {
    const t = this.planillaData.reduce((acc, i) => acc + this.parseMoneda(i.salarioBase), 0);
    return this.formatearMoneda(t);
  }
  get totalDeducciones(): string {
    const t = this.planillaData.reduce((acc, i) => acc + this.parseMoneda(i.deducciones), 0);
    return this.formatearMoneda(t);
  }
  get totalNeto(): string {
    const t = this.planillaData.reduce((acc, i) => acc + this.parseMoneda(i.neto), 0);
    return this.formatearMoneda(t);
  }

  getEstadoClass(estado: string): string { return 'status-badge--calculated'; }

  private mostrarNotificacion(mensaje: string): void {
    this.mensajeExito = mensaje;
    this.mostrarMensajeExito = true;
    setTimeout(() => this.mostrarMensajeExito = false, 3000);
  }

  private parseMoneda(valor: string): number {
    return Number(valor.replace('Q', '').replace(/,/g, '').trim()) || 0;
  }

  private formatearMoneda(valor: number): string {
    return `Q ${Number(valor).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  obtenerNombrePeriodo(): string {
    const p = this.periodosDisponibles.find(x => x.periodoId === this.periodoId);
    return p ? p.nombre : 'Abril 2026';
  }
}

import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { ReportsService, BonusEligibilityReport } from '../../../services/reports.service';
import jsPDF from 'jspdf';

interface BonoItem {
  id: number;
  empleado: string;
  departamento: string;
  cumplimiento: string;
  estado: string;
  periodo: string;
  regla: string;
  bono: string;
  motivo: string;
  detalles?: any;
}

@Component({
  selector: 'app-bonos-incentivos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bonos-incentivos.html',
  styleUrl: './bonos-incentivos.css',
})
export class BonosIncentivos implements OnInit {
  activeTab: 'resultados' | 'reglas' = 'resultados';
  filtroBusqueda = '';
  filtroPeriodo = '';

  mesActual = new Date().getMonth() + 1;
  anioActual = new Date().getFullYear();

  modalRegla = false;
  modalDetalleBono = false;
  modoEdicion = false;
  isEvaluating = false;
  isSaving = false;

  reglaForm: any = this.getReglaVacia();
  bonoDetalle: any = null;

  bonosData: BonoItem[] = [];
  reglasData: any[] = [];
  mostrarMensajeExito = false;
  mensajeExito = '';

  constructor(
    private router: Router,
    private adminService: AdminService,
    private reportsService: ReportsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    this.filtroPeriodo = `${months[this.mesActual - 1]} ${this.anioActual}`;
    this.loadData();
  }

  setTab(tab: 'resultados' | 'reglas'): void {
    this.activeTab = tab;
    this.loadData();
  }

  loadData(): void {
    this.adminService.getBonusRules().subscribe({
      next: (data: any[]) => {
        this.reglasData = data.map(r => ({
          id: r.reglaBonoId,
          nombre: r.nombre,
          vigencia: r.vigenciaInicio,
          minAsistencia: r.minDiasTrabajados || 0,
          maxTardias: r.maxTardias || 0,
          maxFaltas: r.maxFaltas || 0,
          minHoras: r.minHoras || 0,
          monto: Number(r.monto) || 0,
          activo: r.activo,
          estado: r.activo ? 'Activo' : 'Inactivo'
        }));
        this.cdr.detectChanges();
      }
    });

    this.reportsService.getBonusEligibility(this.mesActual, this.anioActual).subscribe({
      next: (data: BonusEligibilityReport[]) => {
        this.bonosData = data.map(b => ({
          id: b.empleadoId,
          empleado: b.nombreCompleto,
          departamento: b.departamento || '-',
          cumplimiento: `${Number(b.cumplimientoPct || 0).toFixed(1)}%`,
          estado: b.elegible ? 'Elegible' : 'No elegible',
          periodo: this.filtroPeriodo,
          regla: b.reglaNombre,
          bono: b.elegible ? `Q ${Number(b.monto || 0).toLocaleString('es-GT', {minimumFractionDigits: 2})}` : 'Q 0.00',
          motivo: b.motivoNoElegible || '-',
          detalles: b.detalles
        }));
        this.cdr.detectChanges();
      }
    });
  }

  verInfoBono(bono: BonoItem): void {
    this.bonoDetalle = bono;
    this.modalDetalleBono = true;
  }

  abrirNuevaRegla(): void {
    this.modoEdicion = false;
    this.reglaForm = this.getReglaVacia();
    this.modalRegla = true;
  }

  editarRegla(r: any): void {
    this.modoEdicion = true;
    let fechaISO = '';
    if (r.vigencia) {
        const d = new Date(r.vigencia);
        if (!isNaN(d.getTime())) {
          d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
          fechaISO = d.toISOString().split('T')[0];
        }
    }
    this.reglaForm = {
      reglaBonoId: r.id, nombre: r.nombre, minDiasTrabajados: r.minAsistencia, maxTardias: r.maxTardias,
      maxFaltas: r.maxFaltas, minHoras: r.minHoras, monto: r.monto, activo: r.activo,
      vigenciaInicio: fechaISO || new Date().toISOString().split('T')[0]
    };
    this.modalRegla = true;
  }

  guardarRegla(): void {
    if (this.isSaving) return;
    this.isSaving = true;

    const action = this.modoEdicion
      ? this.adminService.updateBonusRule(this.reglaForm.reglaBonoId, this.reglaForm)
      : this.adminService.createBonusRule(this.reglaForm);

    action.subscribe({
      next: () => {
        setTimeout(() => {
          this.isSaving = false;
          this.modalRegla = false;
          this.notificar('Regla guardada correctamente.');
          this.loadData();
        }, 300);
      },
      error: () => { this.isSaving = false; alert('Error al guardar'); }
    });
  }

  toggleRegla(r: any): void {
    this.adminService.updateBonusRule(r.id, { activo: !r.activo, vigenciaInicio: r.vigencia }).subscribe(() => {
      this.notificar('Estado actualizado.');
      this.loadData();
    });
  }

  ejecutarEvaluacion(): void {
    if (this.isEvaluating) return;
    this.isEvaluating = true;
    this.cdr.detectChanges();

    this.adminService.runBonusEvaluation(this.mesActual, this.anioActual).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.isEvaluating = false;
          this.notificar(res.message);
          this.loadData();
        }, 500);
      },
      error: () => { this.isEvaluating = false; alert('Error al calcular'); }
    });
  }

  private notificar(msg: string): void {
    this.mensajeExito = msg;
    this.mostrarMensajeExito = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.mostrarMensajeExito = false;
      this.mensajeExito = '';
      this.cdr.detectChanges();
    }, 2500);
  }

  exportarExcel(): void {
    if (this.bonosData.length === 0) return;
    let csv = "Empleado,Departamento,Cumplimiento,Estado,Regla,Monto\r\n";
    this.bonosFiltrados.forEach(b => {
      csv += `"${b.empleado}","${b.departamento}","${b.cumplimiento}","${b.estado}","${b.regla}","${b.bono}"\r\n`;
    });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `Reporte_Bonos.csv`; link.click();
  }

  exportarPdf(): void {
    if (this.bonosData.length === 0) return;
    const doc = new jsPDF();
    doc.text(`Elegibilidad a Bonos - ${this.filtroPeriodo}`, 14, 20);
    let y = 30;
    this.bonosFiltrados.forEach(b => {
      doc.text(`${b.empleado} - ${b.estado} - ${b.bono}`, 14, y);
      y += 10;
    });
    doc.save('Reporte_Bonos.pdf');
  }

  getEstadoClass(estado: string): string { return estado === 'Elegible' ? 'badge--green' : 'badge--red'; }
  get bonosFiltrados(): BonoItem[] { return this.bonosData.filter(b => !this.filtroBusqueda || b.empleado.toLowerCase().includes(this.filtroBusqueda.toLowerCase())); }
  private getReglaVacia() { return { nombre: '', minDiasTrabajados: 95, maxTardias: 5, maxFaltas: 2, minHoras: 40, monto: 0, vigenciaInicio: new Date().toISOString().split('T')[0], activo: true }; }
  goBack(): void { this.router.navigate(['/']); }
}

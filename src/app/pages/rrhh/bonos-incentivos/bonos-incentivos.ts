import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { ReportsService } from '../../../services/reports.service';
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
}

interface ReglaItem {
  id: number;
  nombre: string;
  vigencia: string;
  minAsistencia: number;
  maxTardias: number;
  maxFaltas: number;
  minHoras: number;
  monto: number;
  activo: boolean;
  estado: string;
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
  modoEdicion = false;
  isEvaluating = false;

  reglaForm: any = this.getReglaVacia();
  bonosData: BonoItem[] = [];
  reglasData: ReglaItem[] = [];
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

    this.reportsService.getBonusEligibility(this.anioActual, this.mesActual).subscribe({
      next: (data: any[]) => {
        this.bonosData = data.map(b => ({
          id: b.empleadoId,
          empleado: b.nombreCompleto,
          departamento: b.departamento || '-',
          cumplimiento: `${Number(b.cumplimientoPct || 0).toFixed(0)}%`,
          estado: b.elegible ? 'Elegible' : 'No elegible',
          periodo: this.filtroPeriodo,
          regla: b.reglaNombre,
          bono: b.elegible ? `Q ${Number(b.monto).toLocaleString('es-GT', {minimumFractionDigits: 2})}` : 'Q 0.00',
          motivo: b.motivoNoElegible || '-'
        }));
        this.cdr.detectChanges();
      }
    });
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
            fechaISO = d.toISOString().split('T')[0];
        }
    }

    this.reglaForm = {
      reglaBonoId: r.id,
      nombre: r.nombre,
      minDiasTrabajados: r.minAsistencia,
      maxTardias: r.maxTardias,
      maxFaltas: r.maxFaltas,
      minHoras: r.minHoras,
      monto: r.monto,
      activo: r.activo,
      vigenciaInicio: fechaISO || new Date().toISOString().split('T')[0]
    };
    this.modalRegla = true;
  }

  guardarRegla(): void {
    const action = this.modoEdicion
      ? this.adminService.updateBonusRule(this.reglaForm.reglaBonoId, this.reglaForm)
      : this.adminService.createBonusRule(this.reglaForm);

    action.subscribe({
      next: () => {
        this.notificar('Regla de bono guardada correctamente.');
        this.modalRegla = false;
        this.loadData();
      },
      error: (err: any) => alert(err.error?.message || 'Error al guardar')
    });
  }

  toggleRegla(r: ReglaItem): void {
    this.adminService.updateBonusRule(r.id, { activo: !r.activo }).subscribe(() => {
      this.notificar('Estado de regla actualizado.');
      this.loadData();
    });
  }

  ejecutarEvaluacion(): void {
    if (this.isEvaluating) return;
    this.isEvaluating = true;
    this.adminService.runBonusEvaluation(this.mesActual, this.anioActual).subscribe({
      next: (res: any) => {
        this.isEvaluating = false;
        this.notificar(res.message || 'Evaluación completada.');
        this.loadData();
      },
      error: (err: any) => {
        this.isEvaluating = false;
        alert(err.error?.message || 'Error al calcular');
      }
    });
  }

  getEstadoClass(estado: string): string { return estado === 'Elegible' ? 'badge--green' : 'badge--red'; }

  get bonosFiltrados(): BonoItem[] {
    return this.bonosData.filter(b => !this.filtroBusqueda || b.empleado.toLowerCase().includes(this.filtroBusqueda.toLowerCase()));
  }

  private getReglaVacia() { return { nombre: '', minDiasTrabajados: 100, maxTardias: 0, maxFaltas: 0, minHoras: 160, monto: 0, activo: true }; }

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

  goBack(): void { this.router.navigate(['/']); }

  exportarExcel(): void { }
  exportarPdf(): void { }
}

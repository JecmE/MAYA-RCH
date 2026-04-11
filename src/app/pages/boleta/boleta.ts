import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PayrollService, PaycheckDetail, PeriodoPlanilla } from '../../services/payroll.service';

interface ConceptoBoleta {
  id: number;
  concepto: string;
  tipo: 'Ingreso' | 'Deducción';
  monto: string;
  obs: string;
}

interface ResumenBoleta {
  salarioBase: string;
  bonificaciones: string;
  deducciones: string;
  isr: string;
  netoPagar: string;
}

interface BoletaPeriodo {
  resumen: ResumenBoleta;
  conceptos: ConceptoBoleta[];
}

@Component({
  selector: 'app-boleta',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './boleta.html',
  styleUrl: './boleta.css',
})
export class Boleta implements OnInit {
  periodoId: number | null = null;
  periodosDisponibles: { periodoId: number; nombre: string }[] = [];
  showSuccessModal = false;

  resumen: ResumenBoleta = {
    salarioBase: '0.00',
    bonificaciones: '0.00',
    deducciones: '0.00',
    isr: '0.00',
    netoPagar: '0.00',
  };
  conceptosFiltrados: ConceptoBoleta[] = [];

  constructor(
    private router: Router,
    private payrollService: PayrollService,
  ) {}

  ngOnInit(): void {
    this.loadPeriods();
  }

  private loadPeriods(): void {
    this.payrollService.getMyPeriods().subscribe({
      next: (periods: PeriodoPlanilla[]) => {
        this.periodosDisponibles = periods.map((p) => ({
          periodoId: p.periodoId!,
          nombre: p.nombre,
        }));
        if (this.periodosDisponibles.length > 0) {
          this.periodoId = this.periodosDisponibles[0].periodoId;
          this.loadPaycheck();
        }
      },
      error: () => {
        this.periodosDisponibles = [];
      },
    });
  }

  private loadPaycheck(): void {
    if (!this.periodoId) return;

    this.payrollService.getMyPaycheck(this.periodoId).subscribe({
      next: (data: PaycheckDetail) => {
        if (!data.movimientos) {
          this.resumen = {
            salarioBase: '0.00',
            bonificaciones: '0.00',
            deducciones: '0.00',
            isr: '0.00',
            netoPagar: '0.00',
          };
          this.conceptosFiltrados = [];
          return;
        }
        this.resumen = {
          salarioBase: data.tarifaHora
            ? `${(data.horasPagables * data.tarifaHora).toFixed(2)}`
            : '0.00',
          bonificaciones: data.totalBonificaciones
            ? `${data.totalBonificaciones.toFixed(2)}`
            : '0.00',
          deducciones: data.totalDeducciones ? `${data.totalDeducciones.toFixed(2)}` : '0.00',
          isr: this.extractISR(data.movimientos),
          netoPagar: data.montoNeto ? `${data.montoNeto.toFixed(2)}` : '0.00',
        };
        this.conceptosFiltrados = data.movimientos.map((m, index) => ({
          id: index,
          concepto: m.concepto,
          tipo: m.tipo as 'Ingreso' | 'Deducción',
          monto: m.monto.toFixed(2),
          obs: '',
        }));
      },
      error: () => {
        this.resumen = {
          salarioBase: '0.00',
          bonificaciones: '0.00',
          deducciones: '0.00',
          isr: '0.00',
          netoPagar: '0.00',
        };
        this.conceptosFiltrados = [];
      },
    });
  }

  private extractISR(movimientos: any[]): string {
    const isr = movimientos.find((m) => m.concepto.toLowerCase().includes('isr'));
    return isr ? isr.monto.toFixed(2) : '0.00';
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  consultar(): void {
    this.loadPaycheck();
  }

  exportarPDF(): void {
    this.showSuccessModal = true;
  }

  cerrarModal(): void {
    this.showSuccessModal = false;
  }
}

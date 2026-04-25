import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import jsPDF from 'jspdf';
import { AuthService } from '../../services/auth.service';
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

@Component({
  selector: 'app-boleta',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './boleta.html',
  styleUrl: './boleta.css',
})
export class Boleta implements OnInit, OnDestroy {
  private routerSubscription?: Subscription;
  periodoId: number | null = null;
  periodosDisponibles: { periodoId: number; nombre: string }[] = [];
  empleadoNombre = '';
  mensaje = '';
  showSuccessModal = false;
  isBrowser: boolean;

  resumen: ResumenBoleta = { salarioBase: '0.00', bonificaciones: '0.00', deducciones: '0.00', isr: '0.00', netoPagar: '0.00' };
  conceptosFiltrados: ConceptoBoleta[] = [];

  constructor(
    private router: Router,
    private payrollService: PayrollService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadAllData();
      this.routerSubscription = this.router.events
        .pipe(filter((e) => e instanceof NavigationEnd))
        .subscribe((event) => {
          if ((event as NavigationEnd).urlAfterRedirects === '/boleta') this.loadAllData();
        });
    }
  }

  ngOnDestroy(): void { this.routerSubscription?.unsubscribe(); }

  private loadAllData(): void {
    this.authService.getCurrentUser().subscribe(user => {
      this.empleadoNombre = user.nombreCompleto || user.username || '';
      this.cdr.detectChanges();
    });
    this.loadPeriods();
  }

  private loadPeriods(): void {
    this.payrollService.getMyPeriods().subscribe((periods: PeriodoPlanilla[]) => {
      this.periodosDisponibles = periods.map(p => ({ periodoId: p.periodoId!, nombre: p.nombre }));
      if (this.periodosDisponibles.length > 0) {
        this.periodoId = this.periodosDisponibles[0].periodoId;
        this.loadPaycheck();
      } else {
        this.mensaje = 'No se encontraron boletas de pago.';
      }
      this.cdr.detectChanges();
    });
  }

  loadPaycheck(): void {
    if (!this.periodoId) return;
    this.payrollService.getMyPaycheck(this.periodoId).subscribe({
      next: (data: PaycheckDetail) => {
        if (!data || !data.movimientos) {
          this.resetResumen();
          this.mensaje = 'Periodo sin movimientos calculados.';
          this.cdr.detectChanges();
          return;
        }

        this.resumen = {
          salarioBase: Number(data.montoBruto || 0).toLocaleString('es-GT', {minimumFractionDigits: 2}),
          bonificaciones: Number(data.totalBonificaciones || 0).toLocaleString('es-GT', {minimumFractionDigits: 2}),
          deducciones: Number(data.totalDeducciones || 0).toLocaleString('es-GT', {minimumFractionDigits: 2}),
          isr: '0.00', // El ISR se sumará en deducciones pero se puede extraer si se desea
          netoPagar: Number(data.montoNeto || 0).toLocaleString('es-GT', {minimumFractionDigits: 2}),
        };

        this.conceptosFiltrados = data.movimientos.map((m, idx) => ({
          id: idx,
          concepto: m.concepto || 'Concepto',
          tipo: (m.tipo || '').toLowerCase().includes('deduccion') ? 'Deducción' : 'Ingreso',
          monto: Number(m.monto).toLocaleString('es-GT', {minimumFractionDigits: 2}),
          obs: this.getConceptObservation(m.concepto)
        }));
        this.cdr.detectChanges();
      }
    });
  }

  private getConceptObservation(c: string): string {
    const u = c.toUpperCase();
    if (u.includes('IGSS')) return 'Retención legal 4.83%';
    if (u.includes('ISR')) return 'Impuesto sobre la renta';
    if (u.includes('SALARIO')) return 'Sueldo base por horas laboradas';
    if (u.includes('BONO')) return 'Incentivo por cumplimiento de metas';
    return 'Movimiento ordinario';
  }

  private resetResumen(): void {
    this.resumen = { salarioBase: '0.00', bonificaciones: '0.00', deducciones: '0.00', isr: '0.00', netoPagar: '0.00' };
    this.conceptosFiltrados = [];
  }

  consultar(): void { this.loadPaycheck(); }
  goBack(): void { this.router.navigate(['/']); }

  exportarPDF(): void {
    const doc = new jsPDF();
    doc.text('BOLETA DE PAGO REAL', 14, 20);
    doc.text(`Colaborador: ${this.empleadoNombre}`, 14, 30);
    doc.text(`Total a Recibir: Q ${this.resumen.netoPagar}`, 14, 40);
    doc.save('Boleta_Pago.pdf');
    this.showSuccessModal = true;
  }

  cerrarModal(): void {
    this.showSuccessModal = false;
  }
}

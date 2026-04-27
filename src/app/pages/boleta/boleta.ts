import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import jsPDF from 'jspdf';
import { AuthService } from '../../services/auth.service';
import { PayrollService, PaycheckDetail, PeriodoPlanilla } from '../../services/payroll.service';
import { SettingsService } from '../../services/settings.service';

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
  imports: [CommonModule, FormsModule],
  templateUrl: './boleta.html',
  styleUrl: './boleta.css',
})
export class Boleta implements OnInit, OnDestroy {
  private routerSubscription?: Subscription;
  private settingsSub?: Subscription;

  periodoId: number | null = null;
  periodosDisponibles: { periodoId: number; nombre: string }[] = [];
  empleadoNombre = '';
  mensaje = '';
  showSuccessModal = false;
  isBrowser: boolean;
  currencySymbol = 'Q';

  resumen: ResumenBoleta = { salarioBase: '0.00', bonificaciones: '0.00', deducciones: '0.00', isr: '0.00', netoPagar: '0.00' };
  conceptosFiltrados: ConceptoBoleta[] = [];

  constructor(
    private router: Router,
    private payrollService: PayrollService,
    private authService: AuthService,
    private settingsService: SettingsService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadAllData();

      this.settingsSub = this.settingsService.settings$.subscribe(s => {
        this.currencySymbol = s.currencySymbol;
        this.loadPaycheck();
      });

      this.routerSubscription = this.router.events
        .pipe(filter((e) => e instanceof NavigationEnd))
        .subscribe((event) => {
          if ((event as NavigationEnd).urlAfterRedirects === '/boleta') this.loadAllData();
        });
    }
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    this.settingsSub?.unsubscribe();
  }

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

        const isrMov = data.movimientos.find(m => m.concepto.includes('ISR'));
        const isrMonto = isrMov ? Number(isrMov.monto) : 0;

        this.resumen = {
          salarioBase: Number(data.montoBruto || 0).toLocaleString('es-GT', {minimumFractionDigits: 2}),
          bonificaciones: Number(data.totalBonificaciones || 0).toLocaleString('es-GT', {minimumFractionDigits: 2}),
          deducciones: (Number(data.totalDeducciones || 0) - isrMonto).toLocaleString('es-GT', {minimumFractionDigits: 2}),
          isr: isrMonto.toLocaleString('es-GT', {minimumFractionDigits: 2}),
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
    if (u.includes('IGSS')) return 'Retención legal (Sincronizado con Parámetros)';
    if (u.includes('ISR')) return 'Impuesto sobre la renta según tabla legal';
    if (u.includes('SALARIO')) return 'Sueldo base por horas laboradas';
    if (u.includes('BONO')) return 'Incentivo según políticas de rendimiento';
    if (u.includes('DECRETO')) return 'Bonificación de Ley 37-2001';
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
    doc.setFontSize(22);
    doc.text(`MAYA RCH - BOLETA DE PAGO (${this.currencySymbol})`, 14, 20);
    doc.setFontSize(14);
    doc.text(`Colaborador: ${this.empleadoNombre}`, 14, 40);
    doc.text(`Periodo: ${this.periodosDisponibles.find(p => p.periodoId === this.periodoId)?.nombre}`, 14, 50);

    doc.text('------------------------------------------------', 14, 60);
    doc.text(`Sueldo Base: ${this.currencySymbol} ${this.resumen.salarioBase}`, 14, 70);
    doc.text(`Bonificaciones: ${this.currencySymbol} ${this.resumen.bonificaciones}`, 14, 80);
    doc.text(`Deducciones: ${this.currencySymbol} ${this.resumen.deducciones}`, 14, 90);
    doc.text(`ISR Retenido: ${this.currencySymbol} ${this.resumen.isr}`, 14, 100);
    doc.text('------------------------------------------------', 14, 110);
    doc.setFontSize(16);
    doc.text(`TOTAL A RECIBIR: ${this.currencySymbol} ${this.resumen.netoPagar}`, 14, 125);

    doc.save(`Boleta_${this.empleadoNombre}.pdf`);
    this.showSuccessModal = true;
  }

  cerrarModal(): void {
    this.showSuccessModal = false;
  }
}

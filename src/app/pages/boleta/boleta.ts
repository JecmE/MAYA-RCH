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
          if ((event as NavigationEnd).urlAfterRedirects === '/boleta') {
            this.loadAllData();
          }
        });
    }
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  private loadAllData(): void {
    this.loadUserProfile();
    this.loadPeriods();
  }

  private loadUserProfile(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.empleadoNombre = user.nombreCompleto || user.username || '';
        this.cdr.detectChanges();
      },
      error: () => {
        this.empleadoNombre = '';
        this.cdr.detectChanges();
      },
    });
  }

  private loadPeriods(): void {
    this.mensaje = '';
    this.payrollService.getMyPeriods().subscribe({
      next: (periods: PeriodoPlanilla[]) => {
        this.periodosDisponibles = periods.map((p) => ({
          periodoId: p.periodoId!,
          nombre: p.nombre,
        }));

        if (this.periodosDisponibles.length > 0) {
          if (!this.periodoId) {
            this.periodoId = this.periodosDisponibles[0].periodoId;
          }
          this.loadPaycheck();
        } else {
          this.mensaje = 'No se encontraron boletas de pago disponibles para este usuario.';
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.periodosDisponibles = [];
        this.mensaje = 'No se pudo cargar los periodos de la boleta. Intenta recargar la página.';
        this.cdr.detectChanges();
      },
    });
  }

  loadPaycheck(): void {
    if (!this.periodoId) return;

    this.mensaje = '';
    this.payrollService.getMyPaycheck(this.periodoId).subscribe({
      next: (data: PaycheckDetail) => {
        if (!data || !data.movimientos || data.movimientos.length === 0) {
          this.resetResumen();
          this.mensaje = 'No se encontró boleta de pago para el período seleccionado.';
          this.cdr.detectChanges();
          return;
        }

        this.resumen = {
          salarioBase: data.montoBruto ? `${data.montoBruto.toFixed(2)}` : data.tarifaHora ? `${(data.horasPagables * data.tarifaHora).toFixed(2)}` : '0.00',
          bonificaciones: data.totalBonificaciones ? `${data.totalBonificaciones.toFixed(2)}` : '0.00',
          deducciones: data.totalDeducciones ? `${data.totalDeducciones.toFixed(2)}` : '0.00',
          isr: this.extractISR(data.movimientos),
          netoPagar: data.montoNeto ? `${data.montoNeto.toFixed(2)}` : '0.00',
        };

        this.conceptosFiltrados = data.movimientos.map((m, index) => {
          const tipoRaw = String(m.tipo || '').toLowerCase();
          return {
            id: index,
            concepto: m.concepto,
            tipo: tipoRaw === 'deduccion' || tipoRaw === 'deducción' ? 'Deducción' : 'Ingreso',
            monto: m.monto.toFixed(2),
            obs: this.getConceptObservation(m.concepto),
          };
        });
        this.cdr.detectChanges();
      },
      error: () => {
        this.resetResumen();
        this.mensaje = 'Error al cargar la boleta de pago. Revisa tu conexión o intenta de nuevo.';
        this.cdr.detectChanges();
      },
    });
  }

  private resetResumen(): void {
    this.resumen = {
      salarioBase: '0.00',
      bonificaciones: '0.00',
      deducciones: '0.00',
      isr: '0.00',
      netoPagar: '0.00',
    };
    this.conceptosFiltrados = [];
  }

  private extractISR(movimientos: any[]): string {
    const isr = movimientos.find((m) => m.concepto?.toLowerCase().includes('isr'));
    return isr ? isr.monto.toFixed(2) : '0.00';
  }

  private getConceptObservation(concepto: string): string {
    if (!concepto) {
      return '';
    }

    const upper = concepto.toUpperCase();
    if (upper.includes('ISR')) {
      return 'Retención ISR legal';
    }
    if (upper.includes('IGSS')) {
      return 'Retención IGSS laboral';
    }
    if (upper.includes('SALARIO')) {
      return 'Salario base mensual';
    }
    if (upper.includes('BONO')) {
      return 'Bonificación pagada';
    }
    return '';
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  consultar(): void {
    this.mensaje = '';
    this.loadPaycheck();
  }

  exportarPDF(): void {
    if (!this.periodoId || this.periodosDisponibles.length === 0) {
      return;
    }

    const periodo = this.periodosDisponibles.find((p) => p.periodoId === this.periodoId);
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const title = 'Boleta de Pago';

    doc.setFontSize(18);
    doc.text(title, 14, 20);
    doc.setFontSize(12);
    doc.text(`Periodo: ${periodo?.nombre ?? 'N/A'}`, 14, 30);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 36);

    doc.setFontSize(14);
    doc.text('Resumen', 14, 48);
    doc.setFontSize(11);
    doc.text(`Salario Base: Q${this.resumen.salarioBase}`, 14, 56);
    doc.text(`Bonificaciones: Q${this.resumen.bonificaciones}`, 14, 62);
    doc.text(`Deducciones: Q${this.resumen.deducciones}`, 14, 68);
    doc.text(`ISR: Q${this.resumen.isr}`, 14, 74);
    doc.text(`Neto a Pagar: Q${this.resumen.netoPagar}`, 14, 80);

    doc.setFontSize(14);
    doc.text('Detalle de conceptos', 14, 92);

    let y = 100;
    doc.setFontSize(11);
    this.conceptosFiltrados.forEach((concepto) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${concepto.concepto} (${concepto.tipo})`, 14, y);
      doc.text(`Q${concepto.monto}`, 120, y);
      if (concepto.obs) {
        doc.setFontSize(10);
        doc.text(concepto.obs, 14, y + 6);
        y += 6;
        doc.setFontSize(11);
      }
      y += 10;
    });

    doc.save(`boleta-${periodo?.nombre?.replace(/\s+/g, '_') ?? 'pago'}.pdf`);
    this.showSuccessModal = true;
  }

  cerrarModal(): void {
    this.showSuccessModal = false;
  }
}

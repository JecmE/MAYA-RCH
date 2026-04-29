import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { KpiService, KpiDashboard } from '../../../services/kpi.service';

@Component({
  selector: 'app-monthly-history',
  standalone: true,
  imports: [],
  templateUrl: './monthly-history.html',
  styleUrl: './monthly-history.css',
})
export class MonthlyHistory implements OnInit {
  historyData: KpiDashboard[] = [];
  isBrowser: boolean;

  constructor(
    private kpiService: KpiService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadHistory();
    }
  }

  loadHistory(): void {
    this.kpiService.getEmployeeHistory(6).subscribe({
      next: (data: KpiDashboard[]) => {
        // Ordenar de más reciente a más antiguo para la tabla
        this.historyData = [...data].sort((a, b) => {
          if (a.anio !== b.anio) return b.anio! - a.anio!;
          return b.mes! - a.mes!;
        });
        this.cdr.detectChanges();
      },
      error: () => {
        this.historyData = [];
        this.cdr.detectChanges();
      },
    });
  }

  getMonthName(month: number): string {
    const names = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return names[month - 1] || 'N/A';
  }

  getStatusClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('excelente')) return 'status-excellent';
    if (s.includes('bueno')) return 'status-good';
    if (s.includes('observacion')) return 'status-warning';
    if (s.includes('riesgo')) return 'status-risk';
    return '';
  }
}

import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { KpiService, KpiDashboard } from '../../../services/kpi.service';

@Component({
  selector: 'app-top-cards',
  standalone: true,
  imports: [],
  templateUrl: './top-cards.html',
  styleUrl: './top-cards.css',
})
export class TopCards implements OnInit {
  kpiData: { label: string; value: string }[] = [];
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
      this.loadKpiData();
    }
  }

  public loadKpiData(): void {
    this.kpiService.getEmployeeDashboard().subscribe({
      next: (kpi: KpiDashboard) => {
        this.kpiData = [
          { label: 'Días trabajados', value: kpi.diasTrabajados?.toString() || '0' },
          { label: 'Tardías', value: kpi.tardias?.toString() || '0' },
          { label: 'Faltas', value: kpi.faltas?.toString() || '0' },
          {
            label: 'Horas esperadas',
            value: kpi.horasEsperadas ? `${kpi.horasEsperadas} h` : '0 h',
          },
          {
            label: 'Horas trabajadas',
            value: kpi.horasTrabajadas ? `${kpi.horasTrabajadas} h` : '0 h',
          },
          { label: 'Cumplimiento', value: kpi.cumplimientoPct ? `${kpi.cumplimientoPct}%` : '0%' },
          { label: 'Clasificación', value: kpi.clasificacion || 'N/A' },
        ];
        this.cdr.detectChanges();
      },
      error: () => {
        this.kpiData = [
          { label: 'Días trabajados', value: '0' },
          { label: 'Tardías', value: '0' },
          { label: 'Faltas', value: '0' },
          { label: 'Horas esperadas', value: '0 h' },
          { label: 'Horas trabajadas', value: '0 h' },
          { label: 'Cumplimiento', value: '0%' },
          { label: 'Clasificación', value: 'N/A' },
        ];
        this.cdr.detectChanges();
      },
    });
  }
}

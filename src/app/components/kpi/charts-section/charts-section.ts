import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { KpiService, KpiDashboard } from '../../../services/kpi.service';

@Component({
  selector: 'app-charts-section',
  standalone: true,
  imports: [],
  templateUrl: './charts-section.html',
  styleUrl: './charts-section.css',
})
export class ChartsSection implements OnInit {
  historyData: KpiDashboard[] = [];
  currentKpi: KpiDashboard | null = null;
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
      this.loadData();
    }
  }

  loadData(): void {
    this.kpiService.getEmployeeHistory(6).subscribe({
      next: (data: KpiDashboard[]) => {
        this.historyData = data;
        if (data.length > 0) {
          this.currentKpi = data[data.length - 1];
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.historyData = [];
        this.cdr.detectChanges();
      },
    });
  }

  getMonthShortName(month: number): string {
    const names = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return names[month - 1] || '';
  }
}

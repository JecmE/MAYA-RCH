import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ChangeDetectorRef, ViewChild } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { TopCards } from '../../components/kpi/top-cards/top-cards';
import { ChartsSection } from '../../components/kpi/charts-section/charts-section';
import { MonthlyHistory } from '../../components/kpi/monthly-history/monthly-history';
import { KpiService, KpiDashboard as KpiData } from '../../services/kpi.service';

@Component({
  selector: 'app-kpi-dashboard',
  standalone: true,
  imports: [CommonModule, TopCards, ChartsSection, MonthlyHistory],
  templateUrl: './kpi-dashboard.html',
  styleUrl: './kpi-dashboard.css',
})
export class KpiDashboard implements OnInit, OnDestroy {
  private routerSubscription?: Subscription;
  isBrowser: boolean;
  currentKpi: KpiData | null = null;

  @ViewChild(TopCards) topCards!: TopCards;
  @ViewChild(ChartsSection) chartsSection!: ChartsSection;
  @ViewChild(MonthlyHistory) monthlyHistory!: MonthlyHistory;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private kpiService: KpiService,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadCurrentKpi();
      this.routerSubscription = this.router.events
        .pipe(filter((e) => e instanceof NavigationEnd))
        .subscribe((event) => {
          if ((event as NavigationEnd).urlAfterRedirects === '/kpi') {
            this.refreshData();
          }
        });
    }
  }

  private loadCurrentKpi(): void {
    this.kpiService.getEmployeeDashboard().subscribe({
      next: (data) => {
        this.currentKpi = data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.currentKpi = null;
      }
    });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  private refreshData(): void {
    this.loadCurrentKpi();
    if (this.topCards) {
      this.topCards.loadKpiData();
    }
    if (this.chartsSection) {
      this.chartsSection.loadData();
    }
    if (this.monthlyHistory) {
      this.monthlyHistory.loadHistory();
    }
    this.cdr.detectChanges();
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}

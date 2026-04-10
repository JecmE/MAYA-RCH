import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TopCards } from '../../components/kpi/top-cards/top-cards';
import { ChartsSection } from '../../components/kpi/charts-section/charts-section';
import { MonthlyHistory } from '../../components/kpi/monthly-history/monthly-history';

@Component({
  selector: 'app-kpi-dashboard',
  standalone: true,
  imports: [TopCards, ChartsSection, MonthlyHistory],
  templateUrl: './kpi-dashboard.html',
  styleUrl: './kpi-dashboard.css',
})
export class KpiDashboard {
  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/']);
  }
}
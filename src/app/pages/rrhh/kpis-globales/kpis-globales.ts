import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReportsService } from '../../../services/reports.service';

interface KpiSummary {
  avgCompliance: number;
  totalTardies: number;
  totalFaltas: number;
  employeesAtRisk: number;
  complianceTrend: number;
  tardiesTrend: number;
  faltasTrend: number;
}

interface KpiDetailRow {
  id: number;
  empleado: string;
  depto: string;
  tardias: number;
  faltas: number;
  horas: number;
  cumplimiento: string;
  clasificacion: string;
}

@Component({
  selector: 'app-kpis-globales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kpis-globales.html',
  styleUrl: './kpis-globales.css',
})
export class KpisGlobales implements OnInit {
  mesActual = new Date().getMonth() + 1;
  anioActual = new Date().getFullYear();
  departamentoSeleccionado = 'Todos';
  supervisorSeleccionado = 'Todos';

  departamentos: string[] = ['Todos'];
  supervisores: any[] = [{ id: 'Todos', nombre: 'Todos los equipos' }];
  meses = [
    { v: 1, n: 'Enero' }, { v: 2, n: 'Febrero' }, { v: 3, n: 'Marzo' },
    { v: 4, n: 'Abril' }, { v: 5, n: 'Mayo' }, { v: 6, n: 'Junio' },
    { v: 7, n: 'Julio' }, { v: 8, n: 'Agosto' }, { v: 9, n: 'Septiembre' },
    { v: 10, n: 'Octubre' }, { v: 11, n: 'Noviembre' }, { v: 12, n: 'Diciembre' }
  ];

  summary: KpiSummary = {
    avgCompliance: 0,
    totalTardies: 0,
    totalFaltas: 0,
    employeesAtRisk: 0,
    complianceTrend: 0,
    tardiesTrend: 0,
    faltasTrend: 0
  };
  deptStats: any[] = [];
  teamStats: any[] = [];
  distStats: any[] = [];
  tablaData: KpiDetailRow[] = [];

  isLoading = false;
  filtroBusqueda = '';

  constructor(
    private router: Router,
    private reportsService: ReportsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.reportsService.getDepartments().subscribe(deps => {
      this.departamentos = ['Todos', ...deps];
    });
    this.reportsService.getSupervisors().subscribe(sups => {
      this.supervisores = [{ id: 'Todos', nombre: 'Todos los equipos' }, ...sups];
    });
    this.loadKpiData();
  }

  loadKpiData(): void {
    this.isLoading = true;
    this.reportsService.getGlobalKpis(this.mesActual, this.anioActual, this.departamentoSeleccionado, this.supervisorSeleccionado).subscribe({
      next: (res) => {
        this.summary = res.summary;
        this.deptStats = res.deptStats;
        this.teamStats = res.teamStats;
        this.distStats = res.distStats;
        this.tablaData = res.detail;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get filteredData(): KpiDetailRow[] {
    if (!this.filtroBusqueda) return this.tablaData;
    const term = this.filtroBusqueda.toLowerCase();
    return this.tablaData.filter(d =>
      d.empleado.toLowerCase().includes(term) ||
      d.depto.toLowerCase().includes(term) ||
      d.clasificacion.toLowerCase().includes(term)
    );
  }

  getClasificacionClass(clasificacion: string): string {
    if (clasificacion === 'Excelente') return 'status-badge--excellent';
    if (clasificacion === 'Bueno') return 'status-badge--good';
    if (clasificacion === 'Regular') return 'status-badge--warning';
    return 'status-badge--risk';
  }

  getBarWidth(value: number): string {
    return `${Math.min(100, Math.max(5, value))}%`;
  }

  getDistWidth(count: number): string {
    const total = this.tablaData.length || 1;
    return `${(count / total) * 100}%`;
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}

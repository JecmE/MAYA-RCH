import { Component, OnInit } from '@angular/core';
import { KpiService, EmployeeClassification } from '../../../services/kpi.service';

@Component({
  selector: 'app-monthly-history',
  standalone: true,
  imports: [],
  templateUrl: './monthly-history.html',
  styleUrl: './monthly-history.css',
})
export class MonthlyHistory implements OnInit {
  historyData: { label: string; value: string }[] = [];

  constructor(private kpiService: KpiService) {}

  ngOnInit(): void {
    this.loadClassification();
  }

  private loadClassification(): void {
    this.kpiService.getEmployeeClassifications().subscribe({
      next: (classifications: EmployeeClassification[]) => {
        if (classifications.length > 0) {
          const emp = classifications[0];
          this.historyData = [
            { label: 'Empleado', value: emp.nombreCompleto || `ID: ${emp.empleadoId}` },
            {
              label: 'Cumplimiento',
              value: emp.cumplimientoPct ? `${emp.cumplimientoPct}%` : '0%',
            },
            { label: 'Clasificación', value: emp.clasificacion || 'N/A' },
          ];
        } else {
          this.setDefaultData();
        }
      },
      error: () => {
        this.setDefaultData();
      },
    });
  }

  private setDefaultData(): void {
    this.historyData = [
      { label: 'Mes', value: 'Sin datos' },
      { label: 'Días trabajados', value: '0' },
      { label: 'Tardías', value: '0' },
      { label: 'Faltas', value: '0' },
      { label: 'Cumplimiento', value: '0%' },
      { label: 'Clasificación', value: 'N/A' },
    ];
  }
}

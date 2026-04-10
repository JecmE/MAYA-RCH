import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface KpiDashboard {
  diasEsperados: number;
  diasTrabajados: number;
  tardias: number;
  faltas: number;
  horasEsperadas: number;
  horasTrabajadas: number;
  cumplimientoPct: number;
  clasificacion: string;
}

export interface SupervisorKpi {
  empleadoId: number;
  nombreCompleto: string;
  diasEsperados: number;
  diasTrabajados: number;
  tardias: number;
  faltas: number;
  cumplimientoPct: number;
  clasificacion: string;
}

export interface HrKpi {
  totalEmpleados: number;
  empleadosActivos: number;
  promedioCumplimiento: number;
  totalTardias: number;
  totalFaltas: number;
}

export interface EmployeeClassification {
  empleadoId: number;
  nombreCompleto: string;
  clasificacion: string;
  cumplimientoPct: number;
}

@Injectable({ providedIn: 'root' })
export class KpiService {
  private apiUrl = 'http://localhost:3000/api/kpi';

  constructor(private http: HttpClient) {}

  getEmployeeDashboard(): Observable<KpiDashboard> {
    return this.http.get<KpiDashboard>(`${this.apiUrl}/dashboard/employee`);
  }

  getSupervisorDashboard(supervisorId: number): Observable<SupervisorKpi[]> {
    return this.http.get<SupervisorKpi[]>(`${this.apiUrl}/dashboard/supervisor`);
  }

  getHrDashboard(): Observable<HrKpi> {
    return this.http.get<HrKpi>(`${this.apiUrl}/dashboard/hr`);
  }

  getEmployeeClassifications(): Observable<EmployeeClassification[]> {
    return this.http.get<EmployeeClassification[]>(`${this.apiUrl}/employee-classification`);
  }
}

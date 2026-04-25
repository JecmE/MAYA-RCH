import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MonthlyAttendanceReport {
  nombreCompleto: string;
  departamento: string;
  diasAsistidos: number;
  tardias: number;
  horasTrabajadasTotal: number;
}

export interface BonusEligibilityReport {
  nombreCompleto: string;
  departamento: string;
  reglaNombre: string;
  elegible: boolean;
  cumplimientoPct: number;
  monto: number;
}

export interface ProjectHoursReport {
  proyectoNombre: string;
  proyectoCodigo: string;
  nombreEmpleado: string;
  horasTotales: number;
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private apiUrl = environment.apiUrl + '/reports';

  constructor(private http: HttpClient) {}

  getMonthlyAttendance(fechaInicio: string, fechaFin: string, departamento?: string): Observable<MonthlyAttendanceReport[]> {
    return this.http.get<MonthlyAttendanceReport[]>(`${this.apiUrl}/monthly-attendance`, {
      params: { fechaInicio, fechaFin, departamento: departamento || 'Todos' },
    });
  }

  getBonusEligibility(anio: number, mes: number, departamento?: string): Observable<BonusEligibilityReport[]> {
    return this.http.get<BonusEligibilityReport[]>(`${this.apiUrl}/bonus-eligibility`, {
      params: { anio, mes, departamento: departamento || 'Todos' },
    });
  }

  getProjectHours(fechaInicio: string, fechaFin: string, departamento?: string, proyecto?: string): Observable<ProjectHoursReport[]> {
    return this.http.get<ProjectHoursReport[]>(`${this.apiUrl}/project-hours`, {
      params: { fechaInicio, fechaFin, departamento: departamento || 'Todos', proyecto: proyecto || 'Todos los proyectos' },
    });
  }

  getVacationBalances(fechaInicio: string, fechaFin: string, departamento?: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/vacation-balances`, {
      params: { fechaInicio, fechaFin, departamento: departamento || 'Todos' }
    });
  }

  getDepartments(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/departments`);
  }
}

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
  empleadoId: number;
  nombreCompleto: string;
  departamento: string;
  reglaNombre: string;
  elegible: boolean;
  cumplimientoPct: number;
  monto: number;
  detalles: {
    asistencias: number;
    laborables: number;
    tardias: number;
    faltas: number;
    horas: string;
  };
  motivoNoElegible?: string;
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

  getBonusEligibility(mes: number, anio: number, departamento?: string): Observable<BonusEligibilityReport[]> {
    return this.http.get<BonusEligibilityReport[]>(`${this.apiUrl}/bonus-eligibility`, {
      params: { mes, anio, departamento: departamento || 'Todos' },
    });
  }

  getBonusEligibilityRange(fechaInicio: string, fechaFin: string, departamento?: string, proyecto?: string): Observable<BonusEligibilityReport[]> {
    return this.http.get<BonusEligibilityReport[]>(`${this.apiUrl}/bonus-eligibility`, {
      params: { fechaInicio, fechaFin, departamento: departamento || 'Todos', proyecto: proyecto || 'Todos los proyectos' },
    });
  }

  getProjectHours(fechaInicio: string, fechaFin: string, departamento?: string, proyecto?: string): Observable<ProjectHoursReport[]> {
    return this.http.get<ProjectHoursReport[]>(`${this.apiUrl}/project-hours`, {
      params: { fechaInicio, fechaFin, departamento: departamento || 'Todos', proyecto: proyecto || 'Todos los proyectos' },
    });
  }

  getVacationBalances(fechaInicio: string, fechaFin: string, departamento?: string, proyecto?: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/vacation-balances`, {
      params: { fechaInicio, fechaFin, departamento: departamento || 'Todos', proyecto: proyecto || 'Todos los proyectos' }
    });
  }

  getDepartments(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/departments`);
  }

  getGlobalKpis(mes: number, anio: number, departamento?: string, supervisorId?: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/global-kpis`, {
      params: { mes, anio, departamento: departamento || 'Todos', supervisorId: supervisorId || 'Todos' }
    });
  }

  getSupervisors(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/supervisors`);
  }
}

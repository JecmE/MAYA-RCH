import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MonthlyAttendanceReport {
  empleadoId: number;
  nombreCompleto: string;
  codigoEmpleado: string;
  departamento: string;
  diasTrabajados: number;
  tardias: number;
  faltas: number;
  horasTrabajadas: number;
}

export interface BonusEligibilityReport {
  empleadoId: number;
  nombreCompleto: string;
  reglaBonoId: number;
  reglaNombre: string;
  elegible: boolean;
  motivoNoElegible?: string;
}

export interface ProjectHoursReport {
  proyectoId: number;
  proyectoNombre: string;
  empleadoId: number;
  nombreEmpleado: string;
  horasTotales: number;
  horasValidadas: number;
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private apiUrl = 'https://mayarch-fpc5dvefa9cycne9.eastus-01.azurewebsites.net/api/reports';

  constructor(private http: HttpClient) {}

  getMonthlyAttendance(anio: number, mes: number): Observable<MonthlyAttendanceReport[]> {
    return this.http.get<MonthlyAttendanceReport[]>(`${this.apiUrl}/monthly-attendance`, {
      params: { anio, mes },
    });
  }

  getBonusEligibility(anio: number, mes: number): Observable<BonusEligibilityReport[]> {
    return this.http.get<BonusEligibilityReport[]>(`${this.apiUrl}/bonus-eligibility`, {
      params: { anio, mes },
    });
  }

  getProjectHours(
    proyectoId: number,
    fechaInicio: string,
    fechaFin: string,
  ): Observable<ProjectHoursReport[]> {
    return this.http.get<ProjectHoursReport[]>(`${this.apiUrl}/project-hours`, {
      params: { proyectoId, fechaInicio, fechaFin },
    });
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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
  private apiUrl = environment.apiUrl + '/reports';

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
    fecha_inicio: string,
    fecha_fin: string,
  ): Observable<ProjectHoursReport[]> {
    return this.http.get<ProjectHoursReport[]>(`${this.apiUrl}/project-hours`, {
      params: { proyectoId, fecha_inicio, fecha_fin },
    });
  }
}

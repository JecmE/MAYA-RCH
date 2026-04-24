import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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
  clasificaciones?: {
    Excelente: number;
    Bueno: number;
    'En observacion': number;
    'En riesgo': number;
  };
}

export interface EmployeeClassification {
  empleadoId: number;
  nombreCompleto: string;
  clasificacion: string;
  cumplimientoPct: number;
  tardias?: number;
  faltas?: number;
}

export interface EmployeeProfile {
  empleado: {
    nombreCompleto: string;
    puesto: string;
    departamento: string;
    email: string;
  };
  historialAsistencia: {
    fecha: string;
    entrada: string;
    salida: string;
    estado: string;
  }[];
  horasPorProyecto: {
    nombre: string;
    horas: number;
  }[];
  solicitudesRecientes: {
    tipo: string;
    fecha_inicio: string;
    fecha_fin: string;
    estado: string;
  }[];
  kpiActual: {
    cumplimientoPct: number;
    clasificacion: string;
    tardias: number;
    faltas: number;
  } | null;
  comparacionMesAnterior: number;
}

@Injectable({ providedIn: 'root' })
export class KpiService {
  private apiUrl = environment.apiUrl + '/kpi';

  constructor(private http: HttpClient) {}

  getEmployeeDashboard(): Observable<KpiDashboard> {
    return this.http.get<KpiDashboard>(`${this.apiUrl}/dashboard/employee`);
  }

  getSupervisorDashboard(supervisorId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/supervisor`);
  }

  getHrDashboard(): Observable<HrKpi> {
    return this.http.get<HrKpi>(`${this.apiUrl}/dashboard/hr`);
  }

  getEmployeeClassifications(): Observable<EmployeeClassification[]> {
    return this.http.get<EmployeeClassification[]>(`${this.apiUrl}/employee-classification`);
  }

  getEmployeeProfile(empleadoId: number): Observable<EmployeeProfile> {
    return this.http.get<EmployeeProfile>(`${this.apiUrl}/employee/${empleadoId}/profile`);
  }
}

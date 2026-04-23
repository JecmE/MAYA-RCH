import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface KpiDashboard {
  mes?: number;
  anio?: number;
  diasEsperados: number;
  diasTrabajados: number;
  tardias: number;
  faltas: number;
  horasEsperadas: number;
  horasTrabajadas: number;
  cumplimientoPct: number;
  clasificacion: string;
  observacion?: string;
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
    fechaInicio: string;
    fechaFin: string;
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

  getEmployeeDashboard(mes?: number, anio?: number): Observable<KpiDashboard> {
    let params: any = {};
    if (mes) params.mes = mes;
    if (anio) params.anio = anio;
    return this.http.get<KpiDashboard>(`${this.apiUrl}/dashboard/employee`, { params });
  }

  getEmployeeHistory(months: number = 6): Observable<KpiDashboard[]> {
    // Para simplificar, el backend no tiene un endpoint de historial,
    // así que simularemos el historial haciendo varias peticiones paralelas o secuenciales.
    // Sin embargo, para no complicar el servicio, podemos simplemente permitir
    // pasar mes y año al dashboard y dejar que el componente maneje la lógica.
    return new Observable<KpiDashboard[]>(observer => {
      const results: KpiDashboard[] = [];
      const now = new Date();
      let count = 0;

      for (let i = 0; i < months; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        this.getEmployeeDashboard(d.getMonth() + 1, d.getFullYear()).subscribe({
          next: (data) => {
            results.push(data);
            count++;
            if (count === months) {
              // Ordenar por fecha antes de devolver
              observer.next(results.sort((a, b) => {
                if (a.anio !== b.anio) return a.anio! - b.anio!;
                return a.mes! - b.mes!;
              }));
              observer.complete();
            }
          },
          error: () => {
            count++;
            if (count === months) {
              observer.next(results);
              observer.complete();
            }
          }
        });
      }
    });
  }

  getSupervisorDashboard(supervisorId: number, mes?: number, anio?: number): Observable<any> {
    let params: any = {};
    if (mes) params.mes = mes;
    if (anio) params.anio = anio;
    return this.http.get<any>(`${this.apiUrl}/dashboard/supervisor`, { params });
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

  saveObservation(empleadoId: number, mes: number, anio: number, observacion: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/observation/${empleadoId}`, { mes, anio, observacion });
  }
}

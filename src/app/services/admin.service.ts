import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Turno {
  turnoId?: number;
  nombre: string;
  horaEntrada: string;
  horaSalida: string;
  toleranciaMinutos: number;
  horasEsperadasDia: number;
  dias?: string;
  activo: boolean;
}

export interface ParametroKpi {
  [key: string]: string;
}

export interface ReglaBono {
  reglaBonoId?: number;
  nombre: string;
  activo: boolean;
  minDiasTrabajados?: number;
  maxTardias?: number;
  maxFaltas?: number;
  minHoras?: number;
  monto?: number;
  vigenciaInicio: string;
  vigenciaFin?: string;
}

export interface AuditLog {
  auditId: number;
  fechaHora: string;
  usuario: string;
  modulo: string;
  accion: string;
  entidad: string;
  entidadId?: number;
  detalle: string;
}

export interface Rol {
  rolId: number;
  nombre: string;
  descripcion?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = environment.apiUrl + '/admin';

  constructor(private http: HttpClient) {}

  // Turnos
  getShifts(): Observable<Turno[]> {
    return this.http.get<Turno[]>(`${this.apiUrl}/shifts`);
  }

  createShift(data: Partial<Turno>): Observable<Turno[]> {
    return this.http.post<Turno[]>(`${this.apiUrl}/shifts`, data);
  }

  updateShift(id: number, data: Partial<Turno>): Observable<Turno[]> {
    return this.http.put<Turno[]>(`${this.apiUrl}/shifts/${id}`, data);
  }

  deleteShift(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/shifts/${id}`);
  }

  // Asignación de Turnos
  getAssignments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/shifts/assignments`);
  }

  assignShift(data: any): Observable<any[]> {
    return this.http.post<any[]>(`${this.apiUrl}/shifts/assignments`, data);
  }

  runBonusEvaluation(mes: number, anio: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/bonus/evaluate`, { mes, anio });
  }

  seedJoseCuevas(): Observable<any> {
    return this.http.post(`${this.apiUrl}/seed-jose-cuevas`, {});
  }

  // Parámetros KPI
  getKpiParameters(): Observable<ParametroKpi> {
    return this.http.get<ParametroKpi>(`${this.apiUrl}/kpi-parameters`);
  }

  updateKpiParameters(data: ParametroKpi): Observable<ParametroKpi> {
    return this.http.put<ParametroKpi>(`${this.apiUrl}/kpi-parameters`, data);
  }

  // Reglas Bono
  getBonusRules(): Observable<ReglaBono[]> {
    return this.http.get<ReglaBono[]>(`${this.apiUrl}/bonus-rules`);
  }

  createBonusRule(data: Partial<ReglaBono>): Observable<ReglaBono[]> {
    return this.http.post<ReglaBono[]>(`${this.apiUrl}/bonus-rules`, data);
  }

  updateBonusRule(id: number, data: Partial<ReglaBono>): Observable<ReglaBono[]> {
    return this.http.put<ReglaBono[]>(`${this.apiUrl}/bonus-rules/${id}`, data);
  }

  deleteBonusRule(id: number): Observable<ReglaBono[]> {
    return this.http.delete<ReglaBono[]>(`${this.apiUrl}/bonus-rules/${id}`);
  }

  // Audit Logs
  getAuditLogs(
    fechaInicio?: string,
    fechaFin?: string,
    usuarioId?: number,
    modulo?: string,
  ): Observable<AuditLog[]> {
    let params: any = {};
    if (fechaInicio) params.fechaInicio = fechaInicio;
    if (fechaFin) params.fechaFin = fechaFin;
    if (usuarioId) params.usuarioId = usuarioId;
    if (modulo) params.modulo = modulo;
    return this.http.get<AuditLog[]>(`${this.apiUrl}/audit-logs`, { params });
  }

  // Roles
  getRoles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(`${this.apiUrl}/roles`);
  }

  // Dashboard Stats
  getAdminDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/admin`);
  }

  getRrhhDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/rrhh`);
  }

  getSupervisorDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/supervisor`);
  }

  // Gestión de Usuarios
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`);
  }

  createUser(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users`, data);
  }

  updateUser(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/users/${id}`, data);
  }

  resetPassword(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users/${id}/reset-password`, {});
  }

  toggleUserStatus(id: number, status: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/users/${id}/status`, { status });
  }
}

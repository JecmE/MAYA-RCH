import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Turno {
  turnoId?: number;
  nombre: string;
  horaEntrada: string;
  horaSalida: string;
  toleranciaMinutos: number;
  horasEsperadasDia: number;
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
  private apiUrl = 'http://localhost:3000/api/admin';

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
}

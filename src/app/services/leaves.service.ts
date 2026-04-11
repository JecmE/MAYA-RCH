import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TipoPermiso {
  tipoPermisoId: number;
  nombre: string;
  requiereDocumento: boolean;
  descuentaVacaciones: boolean;
  activo: boolean;
}

export interface SolicitudPermiso {
  solicitudId?: number;
  empleadoId: number;
  tipoPermisoId: number;
  fechaInicio: string;
  fechaFin: string;
  horasInicio?: string;
  horasFin?: string;
  motivo: string;
  estado: string;
  fechaSolicitud?: string;
  tipoPermiso?: TipoPermiso;
  decisiones?: DecisionPermiso[];
  adjuntos?: AdjuntoSolicitud[];
  archivo?: string;
  nombreArchivo?: string;
  tipoMime?: string;
}

export interface AdjuntoSolicitud {
  adjuntoId: number;
  nombreArchivo: string;
  rutaUrl: string;
}

export interface DecisionPermiso {
  decisionId?: number;
  solicitudId: number;
  usuarioId: number;
  decision: string;
  comentario: string;
  fechaHora?: string;
}

export interface VacationBalance {
  saldoId: number;
  empleadoId: number;
  diasDisponibles: number;
  diasUsados: number;
  diasLibres: number;
  diasTotales: number;
  fechaCorte: string;
}

@Injectable({ providedIn: 'root' })
export class LeavesService {
  private apiUrl = environment.apiUrl + '/leaves';

  constructor(private http: HttpClient) {}

  getTypes(): Observable<TipoPermiso[]> {
    return this.http.get<TipoPermiso[]>(`${this.apiUrl}/types`);
  }

  createRequest(request: Partial<SolicitudPermiso>): Observable<SolicitudPermiso> {
    return this.http.post<SolicitudPermiso>(`${this.apiUrl}/request`, request);
  }

  getMyRequests(): Observable<SolicitudPermiso[]> {
    return this.http.get<SolicitudPermiso[]>(`${this.apiUrl}/my-requests`);
  }

  getPendingRequests(): Observable<SolicitudPermiso[]> {
    return this.http.get<SolicitudPermiso[]>(`${this.apiUrl}/pending`);
  }

  approveRequest(id: number, comentario: string): Observable<DecisionPermiso> {
    return this.http.put<DecisionPermiso>(`${this.apiUrl}/${id}/approve`, { comentario });
  }

  rejectRequest(id: number, comentario: string): Observable<DecisionPermiso> {
    return this.http.put<DecisionPermiso>(`${this.apiUrl}/${id}/reject`, { comentario });
  }

  getVacationBalance(): Observable<VacationBalance> {
    return this.http.get<VacationBalance>(`${this.apiUrl}/vacation-balance`);
  }

  getVacationBalanceByEmployee(employeeId: number): Observable<VacationBalance> {
    return this.http.get<VacationBalance>(`${this.apiUrl}/vacation-balance/${employeeId}`);
  }

  downloadAttachment(rutaUrl: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}${rutaUrl}`, {
      responseType: 'blob',
    });
  }
}

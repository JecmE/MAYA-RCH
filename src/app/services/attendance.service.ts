import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AttendanceRecord {
  asistenciaId?: number;
  empleadoId: number;
  fecha: string;
  horaEntradaReal?: string;
  horaSalidaReal?: string;
  minutosTardia?: number;
  horasTrabajadas?: number;
  estadoJornada: string;
  observacion?: string;
}

export interface TeamAttendance {
  empleadoId: number;
  nombreCompleto: string;
  codigoEmpleado: string;
  departamento: string;
  puesto?: string;
  asistencia: AttendanceRecord | null;
}

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private apiUrl = environment.apiUrl + '/attendance';

  constructor(private http: HttpClient) {}

  // Usamos 'any' para evitar errores de compilacion en momentos de urgencia
  checkIn(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/check-in`, payload);
  }

  checkOut(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/check-out`, payload);
  }

  getTodayStatus(): Observable<any> {
    return this.http.get(`${this.apiUrl}/today`);
  }

  getHistory(fechaInicio?: string, fechaFin?: string): Observable<AttendanceRecord[]> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
    if (fechaFin) params = params.set('fechaFin', fechaFin);
    return this.http.get<AttendanceRecord[]>(`${this.apiUrl}/history`, { params });
  }

  getTeamAttendance(supervisorId: number, fecha?: string): Observable<TeamAttendance[]> {
    let params = new HttpParams();
    if (fecha) params = params.set('fecha', fecha);
    return this.http.get<TeamAttendance[]>(`${this.apiUrl}/team`, { params });
  }

  adjustAttendance(id: number, adjust: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/adjust/${id}`, adjust);
  }

  getAllAttendance(fechaInicio?: string, fechaFin?: string): Observable<any[]> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
    if (fechaFin) params = params.set('fechaFin', fechaFin);
    return this.http.get<any[]>(`${this.apiUrl}/all`, { params });
  }

  getAdjustmentHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/adjustments/history`);
  }
}

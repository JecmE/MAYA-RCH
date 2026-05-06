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

export interface TodayStatus {
  asistenciaId?: number;
  fecha: string;
  horaEntradaReal?: string;
  horaSalidaReal?: string;
  minutosTardia?: number;
  horasTrabajadas?: number;
  estadoJornada: string;
  observacion?: string;
  tieneEntrada: boolean;
  tieneSalida: boolean;
  turnoNombre?: string;
  toleranciaMinutos?: number;
  horaEntradaTurno?: string;
  horaSalidaTurno?: string;
}

export interface CheckInResponse {
  message: string;
  asistencia: AttendanceRecord;
  minutosTardia: number;
}

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private apiUrl = environment.apiUrl + '/attendance';

  constructor(private http: HttpClient) {}

  checkIn(payload: { localTime: string, localDate: string }): Observable<CheckInResponse> {
    return this.http.post<CheckInResponse>(`${this.apiUrl}/check-in`, payload);
  }

  checkOut(payload: { localTime: string, localDate: string }): Observable<{ message: string; asistencia: AttendanceRecord }> {
    return this.http.post<{ message: string; asistencia: AttendanceRecord }>(`${this.apiUrl}/check-out`, payload);
  }

  getTodayStatus(): Observable<TodayStatus> {
    return this.http.get<TodayStatus>(`${this.apiUrl}/today`);
  }

  getHistory(fechaInicio?: string, fechaFin?: string): Observable<AttendanceRecord[]> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
    if (fechaFin) params = params.set('fechaFin', fechaFin);
    return this.http.get<AttendanceRecord[]>(`${this.apiUrl}/history`, { params });
  }

  getEmployeeAttendance(employeeId: number): Observable<AttendanceRecord[]> {
    return this.http.get<AttendanceRecord[]>(`${this.apiUrl}/employee/${employeeId}`);
  }

  getTeamAttendance(supervisorId: number, fecha?: string): Observable<TeamAttendance[]> {
    let params = new HttpParams();
    if (fecha) params = params.set('fecha', fecha);
    return this.http.get<TeamAttendance[]>(`${this.apiUrl}/team`, { params });
  }

  getAllAttendance(fechaInicio?: string, fechaFin?: string): Observable<any[]> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
    if (fechaFin) params = params.set('fechaFin', fechaFin);
    return this.http.get<any[]>(`${this.apiUrl}/all`, { params });
  }

  adjustAttendance(id: number, adjust: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/adjust/${id}`, adjust);
  }

  getAdjustmentHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/adjustments/history`);
  }
}

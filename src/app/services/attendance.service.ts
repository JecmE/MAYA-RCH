import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

export interface CheckInResponse {
  message: string;
  asistencia: AttendanceRecord;
  minutosTardia: number;
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

  checkIn(): Observable<CheckInResponse> {
    return this.http.post<CheckInResponse>(`${this.apiUrl}/check-in`, {});
  }

  checkOut(): Observable<{ message: string; asistencia: AttendanceRecord }> {
    return this.http.post<{ message: string; asistencia: AttendanceRecord }>(
      `${this.apiUrl}/check-out`,
      {},
    );
  }

  getTodayStatus(): Observable<TodayStatus> {
    return this.http.get<TodayStatus>(`${this.apiUrl}/today`);
  }

  getHistory(fechaInicio?: string, fechaFin?: string): Observable<AttendanceRecord[]> {
    let params: any = {};
    if (fechaInicio) params.fechaInicio = fechaInicio;
    if (fechaFin) params.fechaFin = fechaFin;
    return this.http.get<AttendanceRecord[]>(`${this.apiUrl}/history`, { params });
  }

  getEmployeeAttendance(employeeId: number): Observable<AttendanceRecord[]> {
    return this.http.get<AttendanceRecord[]>(`${this.apiUrl}/employee/${employeeId}`);
  }

  adjustAttendance(
    id: number,
    adjust: { campo: string; valorAnterior: any; valorNuevo: any; motivo: string },
  ): Observable<any> {
    return this.http.put(`${this.apiUrl}/adjust/${id}`, adjust);
  }

  getTeamAttendance(supervisorId: number, fecha?: string): Observable<TeamAttendance[]> {
    let params: any = {};
    if (fecha) params.fecha = fecha;
    return this.http.get<TeamAttendance[]>(`${this.apiUrl}/team`, { params });
  }

  getAllAttendance(fecha?: string): Observable<any[]> {
    let params: any = {};
    if (fecha) params.fecha = fecha;
    return this.http.get<any[]>(`${this.apiUrl}/all`, { params });
  }
}

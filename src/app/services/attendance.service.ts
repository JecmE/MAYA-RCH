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

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private apiUrl = environment.apiUrl + '/attendance';

  constructor(private http: HttpClient) {}

  checkIn(payload: { localTime: string, localDate: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/check-in`, payload);
  }

  checkOut(payload: { localTime: string, localDate: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/check-out`, payload);
  }

  getTodayStatus(): Observable<any> {
    return this.http.get(`${this.apiUrl}/today`);
  }

  getHistory(fechaInicio?: string, fechaFin?: string): Observable<AttendanceRecord[]> {
    let params: any = {};
    if (fechaInicio) params.fechaInicio = fechaInicio;
    if (fechaFin) params.fechaFin = fechaFin;
    return this.http.get<AttendanceRecord[]>(`${this.apiUrl}/history`, { params });
  }

  getTeamAttendance(supervisorId: number, fecha?: string): Observable<any[]> {
    let params: any = {};
    if (fecha) params.fecha = fecha;
    return this.http.get<any[]>(`${this.apiUrl}/team`, { params });
  }

  // Resto de métodos simplificados para no fallar
  adjustAttendance(id: number, adjust: any): Observable<any> { return this.http.put(`${this.apiUrl}/adjust/${id}`, adjust); }
  getAllAttendance(fI?: string, fF?: string): Observable<any[]> { return this.http.get<any[]>(`${this.apiUrl}/all`, { params: { fI, fF } }); }
  getAdjustmentHistory(): Observable<any[]> { return this.http.get<any[]>(`${this.apiUrl}/adjustments/history`); }
}

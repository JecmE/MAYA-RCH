import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RegistroTiempo {
  tiempoId?: number;
  empleadoId: number;
  proyectoId: number;
  fecha: string;
  horas: number;
  actividadDescripcion?: string;
  estado: string;
  horasValidadas?: number;
  proyectoCodigo?: string;
  proyectoNombre?: string;
  comentario?: string;
  decision?: string;
  adjuntoUrl?: string;
}

export interface TeamTimesheetEntry {
  tiempoId: number;
  empleadoId: number;
  nombreCompleto: string;
  proyectoId: number;
  nombreProyecto: string;
  fecha: string;
  horas: number;
  actividadDescripcion: string;
  estado: string;
  adjuntoUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class TimesheetsService {
  private apiUrl = environment.apiUrl + '/timesheets';

  constructor(private http: HttpClient) {}

  getMyEntries(): Observable<RegistroTiempo[]> {
    return this.http.get<RegistroTiempo[]>(this.apiUrl);
  }

  createEntry(data: Partial<RegistroTiempo>): Observable<RegistroTiempo> {
    return this.http.post<RegistroTiempo>(`${this.apiUrl}/entry`, data);
  }

  getTeamEntries(supervisorId: number, fecha?: string): Observable<TeamTimesheetEntry[]> {
    let params: any = {};
    if (fecha) params.fecha = fecha;
    return this.http.get<TeamTimesheetEntry[]>(`${this.apiUrl}/team`, { params });
  }

  approveEntry(id: number, comentario: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/approve`, { comentario });
  }

  rejectEntry(id: number, comentario: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/reject`, { comentario });
  }

  getProjectSummary(proyectoId: number, fechaInicio: string, fechaFin: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/report/project-summary`, {
      params: { proyectoId, fechaInicio, fechaFin },
    });
  }

  downloadAttachment(fileName: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/attachment/${fileName}`, {
      responseType: 'blob'
    });
  }
}

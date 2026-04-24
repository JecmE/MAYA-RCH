import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Proyecto {
  proyectoId?: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  responsable?: string;
  departamentoId?: number;
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private apiUrl = environment.apiUrl + '/projects';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Proyecto[]> {
    return this.http.get<Proyecto[]>(this.apiUrl);
  }

  getAdminStaff(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/staff`);
  }

  getById(id: number): Observable<Proyecto> {
    return this.http.get<Proyecto>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<Proyecto>): Observable<Proyecto> {
    return this.http.post<Proyecto>(this.apiUrl, data);
  }

  update(id: number, data: Partial<Proyecto>): Observable<Proyecto> {
    return this.http.put<Proyecto>(`${this.apiUrl}/${id}`, data);
  }

  assignEmployee(data: { proyectoId: number, empleadoId: number, fechaInicio: string, fechaFin?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/assign`, data);
  }

  unassignEmployee(empProyId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/unassign/${empProyId}`);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

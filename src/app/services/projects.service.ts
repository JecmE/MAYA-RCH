import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Proyecto {
  proyectoId?: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  departamentoId?: number;
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private apiUrl = 'https://mayarch-fpc5dvefa9cycne9.centralus-01.azurewebsites.net/api/projects';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Proyecto[]> {
    return this.http.get<Proyecto[]>(this.apiUrl);
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

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

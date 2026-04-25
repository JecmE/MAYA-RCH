import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Notice {
  avisoId: number;
  usuarioId: number;
  titulo: string;
  mensaje: string;
  tipo: string;
  fechaHora: string;
  leido: boolean;
  // Propiedades opcionales para compatibilidad con la UI
  id?: number;
  title?: string;
  text?: string;
  color?: string;
  icon?: string;
}

// Alias para compatibilidad con el resto del sistema
export type Aviso = Notice;

@Injectable({ providedIn: 'root' })
export class NoticesService {
  private apiUrl = environment.apiUrl + '/notices';

  constructor(private http: HttpClient) {}

  getMyNotices(): Observable<Notice[]> {
    return this.http.get<Notice[]>(this.apiUrl);
  }

  deleteNotice(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  clearAll(): Observable<any> {
    return this.http.delete(this.apiUrl);
  }
}

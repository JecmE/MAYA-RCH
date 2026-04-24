import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Aviso {
  avisoId: number;
  usuarioId: number;
  titulo: string;
  mensaje: string;
  tipo: string;
  fechaHora: string;
  leido: boolean;
}

@Injectable({ providedIn: 'root' })
export class NoticesService {
  private apiUrl = environment.apiUrl + '/notices';

  constructor(private http: HttpClient) {}

  getMyNotices(): Observable<Aviso[]> {
    return this.http.get<Aviso[]>(this.apiUrl);
  }

  deleteNotice(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  clearAll(): Observable<any> {
    return this.http.delete(this.apiUrl);
  }
}

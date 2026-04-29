import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Empleado {
  empleadoId?: number;
  codigoEmpleado: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  fechaIngreso: string;
  activo: boolean;
  departamentoId?: number;
  departamento?: string;
  puesto?: string;
  tarifaHora?: number;
  supervisorId?: number;
  supervisorNombre?: string;
  nombreCompleto?: string;
  roles?: string[];
}

export interface CreateEmpleadoDto {
  codigoEmpleado: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  fechaIngreso: string;
  supervisorId?: number;
  departamento?: string;
  puesto?: string;
  tarifaHora?: number;
  activo?: boolean;
}

export interface Usuario {
  usuarioId?: number;
  empleadoId: number;
  username: string;
  password?: string;
  estado: string;
  roles: string[];
}

export interface CreateUsuarioDto {
  username: string;
  password: string;
  rolIds: number[];
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private apiUrl = environment.apiUrl + '/users';

  constructor(private http: HttpClient) {}

  getAll(activo?: string): Observable<Empleado[]> {
    let params: any = {};
    if (activo !== undefined) params.activo = activo;
    return this.http.get<Empleado[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Empleado> {
    return this.http.get<Empleado>(`${this.apiUrl}/${id}`);
  }

  getMyProfile(): Observable<Empleado> {
    return this.http.get<Empleado>(`${this.apiUrl}/me`);
  }

  updateMyProfile(data: Partial<CreateEmpleadoDto>): Observable<Empleado> {
    return this.http.put<Empleado>(`${this.apiUrl}/me`, data);
  }

  changePassword(data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/me/password`, data);
  }

  create(data: CreateEmpleadoDto): Observable<Empleado> {
    return this.http.post<Empleado>(this.apiUrl, data);
  }

  update(id: number, data: Partial<CreateEmpleadoDto>): Observable<Empleado> {
    return this.http.put<Empleado>(`${this.apiUrl}/${id}`, data);
  }

  deactivate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  deletePermanent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/permanent`);
  }

  createUsuario(empleadoId: number, data: CreateUsuarioDto): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/${empleadoId}/usuario`, data);
  }

  updateUsuario(empleadoId: number, data: Partial<CreateUsuarioDto>): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${empleadoId}/usuario`, data);
  }

  getTeamBySupervisor(supervisorId: number): Observable<Empleado[]> {
    return this.http.get<Empleado[]>(`${this.apiUrl}/${supervisorId}/equipo`);
  }
}

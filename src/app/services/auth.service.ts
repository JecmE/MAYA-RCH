import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    usuarioId: number;
    username: string;
    roles: string[];
    empleadoId: number;
    nombreCompleto?: string;
    email?: string;
  };
}

export interface RegisterRequest {
  username: string;
  password: string;
  codigoEmpleado: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  puesto?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl + '/auth';

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials);
  }

  register(
    request: RegisterRequest,
  ): Observable<{ message: string; usuarioId: number; empleadoId: number }> {
    return this.http.post<any>(`${this.apiUrl}/register`, request);
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/logout`, {});
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/forgot-password`, request);
  }

  resetPassword(request: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/reset-password`, request);
  }

  getCurrentUser(): Observable<LoginResponse['user']> {
    return this.http.get<LoginResponse['user']>(`${this.apiUrl}/me`);
  }

  setToken(token: string): void {
    localStorage.setItem('access_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  clearToken(): void {
    localStorage.removeItem('access_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

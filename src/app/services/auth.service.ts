import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { isPlatformBrowser } from '@angular/common';

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
    rolId?: number; // Añadido para permisos
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
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials);
  }

  register(
    request: RegisterRequest,
  ): Observable<{ message: string; usuarioId: number; empleadoId: number }> {
    return this.http.post<any>(`${this.apiUrl}/register`, request);
  }

  logout(): void {
    if (this.isBrowser) {
        localStorage.clear();
    }
    this.http.post<void>(`${this.apiUrl}/logout`, {}).subscribe();
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
    if (this.isBrowser) {
      localStorage.setItem('access_token', token);
    }
  }

  getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem('access_token');
  }

  clearToken(): void {
    if (this.isBrowser) {
      localStorage.removeItem('access_token');
    }
  }

  isAuthenticated(): boolean {
    if (!this.isBrowser) return false;
    return !!this.getToken();
  }
}

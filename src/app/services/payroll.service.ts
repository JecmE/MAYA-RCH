import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PeriodoPlanilla {
  periodoId?: number;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  tipo: string;
  estado: string;
}

export interface ConceptoPlanilla {
  conceptoId?: number;
  codigo: string;
  nombre: string;
  tipo: string;
  modoCalculo: string;
  baseCalculo?: number;
}

export interface MovimientoPlanilla {
  concepto: string;
  tipo: string;
  monto: number;
}

export interface PaycheckDetail {
  periodo: {
    nombre: string;
    fechaInicio: string;
    fechaFin: string;
  };
  empleadoId: number;
  tarifaHora: number;
  horasPagables: number;
  montoBruto: number;
  totalBonificaciones: number;
  totalDeducciones: number;
  montoNeto: number;
  movimientos: MovimientoPlanilla[];
}

export interface PayrollResult {
  empleadoId: number;
  nombreCompleto: string;
  horasTrabajadas: number;
  montoBruto: number;
  totalBonificaciones: number;
  totalDeducciones: number;
  montoNeto: number;
}

@Injectable({ providedIn: 'root' })
export class PayrollService {
  private apiUrl = 'http://localhost:3000/api/payroll';

  constructor(private http: HttpClient) {}

  getPeriods(): Observable<PeriodoPlanilla[]> {
    return this.http.get<PeriodoPlanilla[]>(`${this.apiUrl}/periods`);
  }

  createPeriod(data: Partial<PeriodoPlanilla>): Observable<PeriodoPlanilla> {
    return this.http.post<PeriodoPlanilla>(`${this.apiUrl}/periods`, data);
  }

  calculatePayroll(periodoId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/periods/${periodoId}/calculate`, {});
  }

  closePeriod(periodoId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/periods/${periodoId}/close`, {});
  }

  getMyPaycheck(periodoId?: number): Observable<PaycheckDetail> {
    let params: any = {};
    if (periodoId) params.periodoId = periodoId;
    return this.http.get<PaycheckDetail>(`${this.apiUrl}/my-paycheck`, { params });
  }

  getMyPeriods(): Observable<PeriodoPlanilla[]> {
    return this.http.get<PeriodoPlanilla[]>(`${this.apiUrl}/my-periods`);
  }

  getConcepts(): Observable<ConceptoPlanilla[]> {
    return this.http.get<ConceptoPlanilla[]>(`${this.apiUrl}/concepts`);
  }
}

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AdminService, ParametroKpi } from './admin.service';

export interface GlobalSettings {
  currency: string;
  currencySymbol: string;
  timezone: string;
  dateFormat: string;
  language: string;
  payrollCycle: string;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private settingsSubject = new BehaviorSubject<GlobalSettings>({
    currency: 'GTQ',
    currencySymbol: 'Q',
    timezone: 'America/Guatemala',
    dateFormat: 'DD/MM/YYYY',
    language: 'Español',
    payrollCycle: 'Mensual'
  });

  public settings$ = this.settingsSubject.asObservable();

  constructor(private adminService: AdminService) {
    this.refreshSettings();
  }

  refreshSettings(): void {
    this.adminService.getKpiParameters().subscribe({
      next: (params) => {
        const currencyStr = params['moneda_sistema'] || 'GTQ';
        const settings: GlobalSettings = {
          currency: currencyStr,
          currencySymbol: currencyStr.includes('USD') ? '$' : 'Q',
          timezone: params['zona_horaria'] || 'America/Guatemala',
          dateFormat: params['formato_fecha'] || 'DD/MM/YYYY',
          language: params['idioma_sistema'] || 'Español',
          payrollCycle: params['ciclo_planilla'] || 'Mensual'
        };
        this.settingsSubject.next(settings);
      }
    });
  }

  get current() {
    return this.settingsSubject.value;
  }
}

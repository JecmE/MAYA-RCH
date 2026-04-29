import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { AdminService } from './admin.service';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

export interface GlobalSettings {
  currency: string;
  currencySymbol: string;
  timezone: string;
  dateFormat: string;
  language: string;
  payrollCycle: string;
  sessionInactivityMinutes: number;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private settingsSubject = new BehaviorSubject<GlobalSettings>({
    currency: 'GTQ',
    currencySymbol: 'Q',
    timezone: 'America/Guatemala',
    dateFormat: 'DD/MM/YYYY',
    language: 'Español',
    payrollCycle: 'Mensual',
    sessionInactivityMinutes: 480
  });

  public settings$ = this.settingsSubject.asObservable();
  private isBrowser: boolean;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser && this.authService.isAuthenticated()) {
        this.refreshSettings();
    }
  }

  refreshSettings(): void {
    // No pedir nada si no estamos en navegador, si no hay sesión o si estamos en login/recuperación
    const isAuthPage = this.router.url.includes('/login') || this.router.url.includes('/forgot-password');
    if (!this.isBrowser || !this.authService.isAuthenticated() || isAuthPage) return;

    this.adminService.getKpiParameters().subscribe({
      next: (params) => {
        const currencyStr = params['moneda_sistema'] || 'GTQ';
        const settings: GlobalSettings = {
          currency: currencyStr,
          currencySymbol: currencyStr.includes('USD') ? '$' : 'Q',
          timezone: params['zona_horaria'] || 'America/Guatemala',
          dateFormat: params['formato_fecha'] || 'DD/MM/YYYY',
          language: params['idioma_sistema'] || 'Español',
          payrollCycle: params['ciclo_planilla'] || 'Mensual',
          sessionInactivityMinutes: params['tiempo_sesion'] ? parseInt(params['tiempo_sesion']) : 480
        };
        this.settingsSubject.next(settings);
      },
      error: () => {
        // Fallback silencioso si falla la petición inicial
      }
    });
  }

  get current() {
    return this.settingsSubject.value;
  }
}

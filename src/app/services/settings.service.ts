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
    if (!this.isBrowser || !this.authService.isAuthenticated()) return;

    // No pedir nada si estamos en login/recuperación (aunque isAuthenticated debería ser falso)
    const isAuthPage = this.router.url.includes('/login') || this.router.url.includes('/forgot-password');
    if (isAuthPage) return;

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
        console.log('[SETTINGS] Parámetros cargados:', settings);
      },
      error: () => {
        console.error('[SETTINGS] Error al cargar parámetros globales.');
      }
    });
  }

  get current() {
    return this.settingsSubject.value;
  }
}

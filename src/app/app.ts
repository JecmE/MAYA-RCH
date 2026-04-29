import { Component, OnInit, OnDestroy, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './services/auth.service';
import { SettingsService } from './services/settings.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`
})
export class App implements OnInit, OnDestroy {
  private checkIntervalSub?: Subscription;
  private isBrowser: boolean;
  private lastActivityTimestamp: number = Date.now();

  constructor(
    private authService: AuthService,
    private settingsService: SettingsService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
        // GUARDIÁN UNIFICADO (REVISIÓN CADA 2 SEGUNDOS)
        this.checkIntervalSub = interval(2000).subscribe(() => {
            if (this.authService.isAuthenticated()) {
                this.checkSecurityPolicies();
            }
        });

        this.updateActivity();
    }
  }

  ngOnDestroy(): void {
    this.checkIntervalSub?.unsubscribe();
  }

  @HostListener('window:mousemove')
  @HostListener('window:mousedown')
  @HostListener('window:keypress')
  @HostListener('window:touchstart')
  @HostListener('window:scroll')
  onUserActivity(): void {
    this.updateActivity();
  }

  private updateActivity(): void {
    if (this.isBrowser) {
        this.lastActivityTimestamp = Date.now();
    }
  }

  private checkSecurityPolicies(): void {
    if (!this.isBrowser) return;

    const now = Date.now();

    // 1. VALIDAR INACTIVIDAD (TIEMPO DE SESIÓN ACTIVA)
    const inactivityLimitMinutes = this.settingsService.current.sessionInactivityMinutes || 480;
    const inactivityLimitMillis = inactivityLimitMinutes * 60 * 1000;

    if (now - this.lastActivityTimestamp >= inactivityLimitMillis) {
        console.warn('EXPULSIÓN: Sesión cerrada por inactividad prolongada.');
        this.handleSessionTimeout();
        return;
    }

    // 2. VALIDAR VENCIMIENTO DE TOKEN (JWT EXPIRATION)
    const token = this.authService.getToken();
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expMillis = payload.exp * 1000;
            if (now >= expMillis) {
                console.warn('EXPULSIÓN: Llave JWT caducada.');
                this.handleSessionTimeout();
            }
        } catch (e) {}
    }
  }

  private handleSessionTimeout(): void {
    if (this.isBrowser) {
        localStorage.clear();
        this.authService.logout();
        this.router.navigate(['/login'], { queryParams: { expired: 'true' } });
    }
  }
}

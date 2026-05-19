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

  private isLoggingOut = false;
  private isChecking = false;

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
        this.checkIntervalSub = interval(2000).subscribe(() => {
            if (this.authService.isAuthenticated() && !this.isLoggingOut && !this.isChecking) {
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
    if (!this.isBrowser || this.isLoggingOut || this.isChecking) return;

    this.isChecking = true;
    const now = Date.now();

    const inactivityLimitMinutes = this.settingsService.current.sessionInactivityMinutes || 480;
    const inactivityLimitMillis = inactivityLimitMinutes * 60 * 1000;

    if (now - this.lastActivityTimestamp >= inactivityLimitMillis) {
        this.handleSessionTimeout('inactivity');
        this.isChecking = false;
        return;
    }

    const token = this.authService.getToken();
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expMillis = payload.exp * 1000;
            if (now >= expMillis) {
                this.handleSessionTimeout('expired');
                this.isChecking = false;
                return;
            }
        } catch (e) {
        }
    }

    this.authService.getCurrentUser().subscribe({
      next: () => {
        this.isChecking = false;
      },
      error: (error) => {
        this.isChecking = false;
        if (error.status === 401 && !this.isLoggingOut) {
          this.handleSessionTimeout('invalid');
        }
      }
    });
  }

  private handleSessionTimeout(reason: string): void {
    if (this.isBrowser && !this.isLoggingOut) {
        this.isLoggingOut = true;
        localStorage.clear();
        this.authService.logout();
        this.router.navigate(['/login'], { queryParams: { expired: 'true', reason } });
    }
  }
}

import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  error = false;
  username = 'empleado';
  password = 'password123';

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  handleLogin(event: Event) {
    event.preventDefault();

    const userLower = this.username.toLowerCase().trim();

    if (['empleado', 'supervisor', 'rrhh', 'admin'].includes(userLower)) {
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('userRole', userLower);
      }
      this.router.navigate(['/']);
    } else {
      this.error = true;
    }
  }
}
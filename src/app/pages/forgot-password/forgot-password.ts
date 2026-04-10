import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  email = '';
  submitted = false;

  constructor(private router: Router) {}

  handleSubmit(event: Event): void {
    event.preventDefault();

    if (this.email.trim()) {
      this.submitted = true;
    }
  }

  volverLogin(): void {
    this.router.navigate(['/login']);
  }
}
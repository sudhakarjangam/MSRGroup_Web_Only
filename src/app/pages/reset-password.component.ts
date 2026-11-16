import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({ standalone: true, imports: [FormsModule, RouterLink], template: `
<section class="auth-card"><h1>Choose a new password</h1>
@if (resetToken) {
  <p class="muted">Choose a new password for your account.</p>
  <form (ngSubmit)="submit()">
    <label>New password (12+ characters)<input type="password" name="password" [(ngModel)]="password" required minlength="12" autocomplete="new-password"></label>
    <label>Confirm new password<input type="password" name="confirmPassword" [(ngModel)]="confirmPassword" required minlength="12" autocomplete="new-password"></label>
    @if (error) { <p class="error">{{ error }}</p> }
    <button class="wide" [disabled]="busy">{{ busy ? 'Updating…' : 'Update password' }}</button>
  </form>
} @else {
  <p class="error">This password reset session is missing or expired. Request a new code.</p>
  <a routerLink="/forgot-password">Request a new code</a>
}
</section>` })
export class ResetPasswordComponent {
  resetToken=history.state?.resetToken ?? '';
  password=''; confirmPassword=''; error=''; busy=false;
  constructor(private auth: AuthService, private router: Router) {}
  submit() {
    if (this.password !== this.confirmPassword) { this.error='Passwords do not match.'; return; }
    this.busy=true; this.error='';
    this.auth.resetPassword(this.resetToken,this.password).subscribe({
      next: () => { this.busy=false; this.router.navigateByUrl('/login', { state: { passwordReset: true } }); },
      error: e => { this.busy=false; this.error=e.error?.message ?? 'Unable to update your password.'; }
    });
  }
}

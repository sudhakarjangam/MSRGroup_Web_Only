import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({ standalone: true, imports: [FormsModule, RouterLink], template: `
<section class="auth-card"><h1>Forgot password</h1>
@if (!challengeId) {
  <p class="muted">Enter the email address or mobile number linked to your account.</p>
  <form (ngSubmit)="requestCode()">
    <label>Email or mobile number<input type="text" name="identifier" [(ngModel)]="identifier" required autocomplete="username"></label>
    @if (error) { <p class="error">{{ error }}</p> }
    @if (message) { <p class="muted">{{ message }}</p> }
    <button class="wide" [disabled]="busy">{{ busy ? 'Sending code…' : 'Send verification code' }}</button>
  </form>
} @else {
  <p class="muted">If your account matches, a verification code has been sent to your registered email or mobile number.</p>
  <form (ngSubmit)="verifyCode()">
    <label>Verification code<input type="text" name="code" [(ngModel)]="code" required minlength="6" maxlength="6" inputmode="numeric" autocomplete="one-time-code"></label>
    @if (error) { <p class="error">{{ error }}</p> }
    <button class="wide" [disabled]="busy">{{ busy ? 'Verifying…' : 'Verify code' }}</button>
  </form>
}
<p class="muted">Remembered your password? <a routerLink="/login">Sign in</a></p></section>` })
export class ForgotPasswordComponent {
  identifier=''; code=''; challengeId=''; error=''; message=''; busy=false;
  constructor(private auth: AuthService, private router: Router) {}
  requestCode() {
    this.busy=true; this.error=''; this.message='';
    this.auth.requestPasswordReset(this.identifier).subscribe({
      next: response => {
        this.busy=false;
        this.challengeId=response.challengeId;
        this.message=response.message;
      },
      error: e => { this.busy=false; this.error=e.error?.message ?? 'Unable to send a verification code.'; }
    });
  }
  verifyCode() {
    this.busy=true; this.error='';
    this.auth.verifyPasswordResetCode(this.challengeId,this.code).subscribe({
      next: response => {
        this.busy=false;
        this.router.navigateByUrl('/reset-password', { state: { resetToken: response.resetToken } });
      },
      error: e => { this.busy=false; this.error=e.error?.message ?? 'Code verification failed.'; }
    });
  }
}

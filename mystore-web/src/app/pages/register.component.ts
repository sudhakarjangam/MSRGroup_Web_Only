import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({ standalone: true, imports: [FormsModule, RouterLink], template: `
<section class="auth-card"><h1>Create account</h1><p class="muted">Create a customer account to shop and manage your cart.</p>
@if (!otpSent) {
<form (ngSubmit)="sendOtp()"><label>Name<input name="name" [(ngModel)]="name" required maxlength="120" autocomplete="name"></label>
<label>Mobile number<input type="tel" name="mobileNumber" [(ngModel)]="mobileNumber" required autocomplete="tel" placeholder="+91 98765 43210"></label>
<label>Email (optional)<input type="email" name="email" [(ngModel)]="email" autocomplete="email"></label>
<label>Password (12+ characters)<input type="password" name="password" [(ngModel)]="password" required minlength="12" autocomplete="new-password"></label>
<label>Confirm password<input type="password" name="confirmPassword" [(ngModel)]="confirmPassword" required minlength="12" autocomplete="new-password"></label>
@if (error) { <p class="error">{{ error }}</p> }<button class="wide" [disabled]="busy">{{ busy ? 'Sending code…' : 'Send verification code' }}</button></form>
} @else {
<p class="muted">Enter the verification code sent to {{ mobileNumber }}.</p>
<form (ngSubmit)="verifyOtp()"><label>Verification code<input type="text" name="otp" [(ngModel)]="otp" required minlength="4" maxlength="8" inputmode="numeric" autocomplete="one-time-code"></label>
@if (error) { <p class="error">{{ error }}</p> }<button class="wide" [disabled]="busy">{{ busy ? 'Verifying…' : 'Verify code and create account' }}</button>
<button type="button" class="wide" [disabled]="busy" (click)="sendOtp()">Resend code</button>
<button type="button" class="wide" [disabled]="busy" (click)="otpSent=false">Edit registration details</button></form>
}
<p class="muted">Already registered? <a routerLink="/login">Sign in</a></p></section>` })
export class RegisterComponent {
  name=''; email=''; mobileNumber=''; password=''; confirmPassword=''; otp=''; error=''; busy=false; otpSent=false;
  constructor(private auth: AuthService, private router: Router) {}
  sendOtp() {
    if (this.password !== this.confirmPassword) { this.error='Passwords do not match.'; return; }
    this.busy=true; this.error='';
    this.auth.requestRegistrationOtp({ email: this.email, mobileNumber: this.mobileNumber, displayName: this.name, password: this.password }).subscribe({
      next: () => { this.busy=false; this.otpSent=true; },
      error: e => { this.busy=false; this.error=e.error?.message ?? 'Unable to send a verification code.'; }
    });
  }
  verifyOtp() {
    this.busy=true; this.error='';
    this.auth.verifyRegistrationOtp(this.mobileNumber,this.otp).subscribe({
      next: () => { this.busy=false; this.router.navigateByUrl('/'); },
      error: e => { this.busy=false; this.error=e.error?.message ?? 'Registration verification failed.'; }
    });
  }
}

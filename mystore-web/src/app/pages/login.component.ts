import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({ standalone: true, imports: [FormsModule, RouterLink], template: `
<section class="auth-card"><h1>Welcome back</h1><p class="muted">Sign in to your MyStore account.</p>
@if (passwordReset) { <p class="muted">Your password has been updated. Sign in with your new password.</p> }
<form (ngSubmit)="submit()"><label>Email or mobile number<input type="text" name="identifier" [(ngModel)]="identifier" required autocomplete="username"></label>
<label>Password<input type="password" name="password" [(ngModel)]="password" required autocomplete="current-password"></label>
@if (error) { <p class="error">{{ error }}</p> }<button class="wide" [disabled]="busy">Sign in</button></form>
<p class="muted"><a routerLink="/forgot-password">Forgot password?</a></p>
<p class="muted">New here? <a routerLink="/register">Create an account</a></p></section>` })
export class LoginComponent {
  identifier=''; password=''; error=''; busy=false; passwordReset=history.state?.passwordReset === true;
  constructor(private auth: AuthService, private router: Router) {}
  submit() { this.busy=true; this.error=''; this.auth.login(this.identifier,this.password).subscribe({ next: x => { this.busy=false; this.router.navigateByUrl(x.user.role==='Admin'?'/admin':'/'); }, error: e => { this.busy=false; this.error=e.error?.message ?? 'Login failed.'; } }); }
}

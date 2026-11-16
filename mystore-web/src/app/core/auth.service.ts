import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, finalize, shareReplay, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, User } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = `${environment.apiBaseUrl}/api/auth`;
  readonly currentUser = signal<User | null>(null);
  private accessToken: string | null = null;
  private refreshRequest: Observable<AuthResponse> | null = null;

  constructor(private http: HttpClient) {}

  get token(): string | null { return this.accessToken; }
  get isAdmin(): boolean { return this.currentUser()?.role === 'Admin'; }
  get isAuthenticated(): boolean { return !!this.accessToken; }

  login(identifier: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, { identifier, password }, { withCredentials: true })
      .pipe(tap(x => this.accept(x)));
  }
  requestRegistrationOtp(details: { email: string; mobileNumber: string; displayName: string; password: string }): Observable<void> {
    return this.http.post<void>(`${this.base}/register/request-otp`, details, { withCredentials: true });
  }
  verifyRegistrationOtp(mobileNumber: string, otp: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/register/verify-otp`, { mobileNumber, otp }, { withCredentials: true })
      .pipe(tap(x => this.accept(x)));
  }
  requestPasswordReset(identifier: string): Observable<{ challengeId: string; message: string }> {
    return this.http.post<{ challengeId: string; message: string }>(`${this.base}/password/forgot`, { identifier });
  }
  verifyPasswordResetCode(challengeId: string, code: string): Observable<{ resetToken: string }> {
    return this.http.post<{ resetToken: string }>(`${this.base}/password/verify-code`, { challengeId, code });
  }
  resetPassword(resetToken: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.base}/password/reset`, { resetToken, newPassword });
  }
  refresh(): Observable<AuthResponse> {
    if (!this.refreshRequest) {
      this.refreshRequest = this.http.post<AuthResponse>(`${this.base}/refresh`, {}, { withCredentials: true })
        .pipe(
          tap(x => this.accept(x)),
          finalize(() => { this.refreshRequest = null; }),
          shareReplay({ bufferSize: 1, refCount: false })
        );
    }
    return this.refreshRequest;
  }
  logout(): Observable<void> {
    return this.http.post<void>(`${this.base}/logout`, {}, { withCredentials: true })
      .pipe(tap(() => { this.accessToken = null; this.currentUser.set(null); }));
  }
  private accept(response: AuthResponse): void {
    this.accessToken = response.accessToken;
    this.currentUser.set(response.user);
  }
}

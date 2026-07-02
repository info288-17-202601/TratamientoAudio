import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { Router } from '@angular/router';

import { AuthSession, AuthUser, LoginPayload, RegisterPayload } from '../models/auth.model';

const TOKEN_KEY = 'public-frontend:token';
const USER_KEY = 'public-frontend:user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly _token = signal<string | null>(this.readToken());
  private readonly _user = signal<AuthUser | null>(this.readUser());

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());

  private get apiUrl(): string {
    return `${import.meta.env.NG_APP_API_URL}/api/auth`;
  }

  // ----------------------------------------------------------------
  // Public API
  // ----------------------------------------------------------------
  login(payload: LoginPayload): Observable<AuthSession> {
    return this.http
      .post<{ ok: boolean; data: AuthSession; message?: string }>(
        `${this.apiUrl}/login`,
        payload,
      )
      .pipe(
        map((res) => (res?.data ?? (res as unknown as AuthSession)) as AuthSession),
        tap((session) => this.persist(session)),
      );
  }

  register(payload: RegisterPayload): Observable<AuthSession> {
    return this.http
      .post<{ ok: boolean; data: AuthSession; message?: string }>(
        `${this.apiUrl}/register`,
        payload,
      )
      .pipe(
        map((res) => (res?.data ?? (res as unknown as AuthSession)) as AuthSession),
        tap((session) => this.persist(session)),
      );
  }

  logout(): void {
    const token = this._token();
    if (token) {
      // Fire-and-forget: si falla, igual limpiamos el estado local.
      this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
        error: () => undefined,
      });
    }
    this.clear();
    this.router.navigateByUrl('/login');
  }

  forgotPassword(email: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  getToken(): string | null {
    return this._token();
  }

  // ----------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------
  private persist(session: AuthSession): void {
    if (!session?.token) {
      return;
    }
    try {
      localStorage.setItem(TOKEN_KEY, session.token);
      if (session.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(session.user));
      }
      if (session.expires_at) {
        localStorage.setItem('public-frontend:expires_at', session.expires_at);
      }
    } catch {
      // localStorage no disponible: continuar en memoria.
    }
    this._token.set(session.token);
    this._user.set(session.user ?? null);
  }

  private clear(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem('public-frontend:expires_at');
    } catch {
      // ignore
    }
    this._token.set(null);
    this._user.set(null);
  }

  private readToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private readUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }
}

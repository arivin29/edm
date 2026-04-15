import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, of, map } from 'rxjs';

import { AuthService as AuthApiService } from '../../api/services/auth.service';
import { TokenResponse } from '../../api/models/token-response';
import { StorageService } from '../services/storage.service';
import { NotificationService } from '../services/notification.service';

// User interface (extend based on your API response)
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  company_id?: string;
  office_id?: string;
  department_id?: string;
  section_id?: string;
  position_id?: string;
  roles: string[];
  permissions: string[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
}

const AUTH_STORAGE_KEY = 'auth';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly router = inject(Router);
  private readonly authApi = inject(AuthApiService);
  private readonly storage = inject(StorageService);
  private readonly notification = inject(NotificationService);

  // State signals
  private _user = signal<User | null>(null);
  private _token = signal<string | null>(null);
  private _refreshToken = signal<string | null>(null);
  private _expiresAt = signal<string | null>(null);
  private _initialized = signal(false);

  // Public readonly signals
  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly initialized = this._initialized.asReadonly();

  // Computed
  readonly isAuthenticated = computed(() => !!this._token() && !!this._user());
  readonly permissions = computed(() => this._user()?.permissions ?? []);
  readonly roles = computed(() => this._user()?.roles ?? []);
  readonly userName = computed(() => this._user()?.name ?? '');
  readonly userEmail = computed(() => this._user()?.email ?? '');

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Login with email and password
   */
  login(email: string, password: string): Observable<TokenResponse> {
    return this.authApi.authLoginPost({ body: { email, password } }).pipe(
      tap((response: any) => {
        if (response.data) {
          this.setTokens(response.data.token!, response.data.refresh_token || '', response.data.expires_at || '');
          // Set user directly from login response if available
          if (response.data.user) {
            this._user.set(response.data.user);
            this.saveToStorage();
          } else {
            // Fallback: Load user profile after login
            this.loadUserProfile();
          }
        }
      }),
      catchError(error => {
        this.notification.error('Login gagal', error?.error?.message || 'Email atau password salah');
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout user
   */
  logout(): void {
    // Call logout API (fire and forget)
    this.authApi.authLogoutPost({}).subscribe({
      error: () => {} // Ignore errors
    });

    // Clear local state
    this.clearAuth();
    this.router.navigate(['/auth/login']);
    this.notification.info('Anda telah logout');
  }

  /**
   * Refresh access token
   * Note: Using $Response method due to incomplete OpenAPI spec
   */
  refreshAccessToken(): Observable<TokenResponse> {
    const refreshToken = this._refreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token'));
    }

    // Use $Response to get actual body (OpenAPI spec returns void but actual response has data)
    return this.authApi.authRefreshPost$Response({ body: { refresh_token: refreshToken } }).pipe(
      map(response => response.body as unknown as TokenResponse),
      tap(response => {
        if (response?.data) {
          this.setTokens(response.data.token!, response.data.refresh_token!, response.data.expires_at!);
        }
      }),
      catchError(error => {
        this.clearAuth();
        this.router.navigate(['/auth/login']);
        return throwError(() => error);
      })
    );
  }

  /**
   * Load current user profile from API
   * Note: Using $Response method due to incomplete OpenAPI spec
   */
  loadUserProfile(): void {
    this.authApi.authMeGet$Response({}).subscribe({
      next: (response) => {
        const data = response.body as any;
        if (data?.data) {
          this._user.set(data.data);
          this.saveToStorage();
        }
      },
      error: (error) => {
        console.error('Failed to load user profile:', error);
      }
    });
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    return this.permissions().includes(permission);
  }

  /**
   * Check if user has any of the permissions
   */
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(p => this.hasPermission(p));
  }

  /**
   * Check if user has all permissions
   */
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(p => this.hasPermission(p));
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    return this.roles().includes(role);
  }

  /**
   * Check if user has any of the roles
   */
  hasAnyRole(roles: string[]): boolean {
    return roles.some(r => this.hasRole(r));
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    const expiresAt = this._expiresAt();
    if (!expiresAt) return true;
    return new Date(expiresAt) <= new Date();
  }

  // Private methods

  private setTokens(token: string, refreshToken: string, expiresAt: string): void {
    this._token.set(token);
    this._refreshToken.set(refreshToken);
    this._expiresAt.set(expiresAt);
    this.saveToStorage();
  }

  private clearAuth(): void {
    this._user.set(null);
    this._token.set(null);
    this._refreshToken.set(null);
    this._expiresAt.set(null);
    this.storage.remove(AUTH_STORAGE_KEY);
  }

  private saveToStorage(): void {
    const state: AuthState = {
      user: this._user(),
      token: this._token(),
      refreshToken: this._refreshToken(),
      expiresAt: this._expiresAt()
    };
    this.storage.set(AUTH_STORAGE_KEY, state);
  }

  private loadFromStorage(): void {
    const state = this.storage.get<AuthState>(AUTH_STORAGE_KEY);
    if (state && state.token) {
      // Check if token is expired
      if (state.expiresAt && new Date(state.expiresAt) <= new Date()) {
        // Token expired, clear auth (don't try refresh here to avoid circular dep)
        this.clearAuth();
      } else {
        // Token still valid, restore state from storage
        this._user.set(state.user);
        this._token.set(state.token);
        this._refreshToken.set(state.refreshToken);
        this._expiresAt.set(state.expiresAt);
        // Note: Don't call loadUserProfile() here - it causes circular dependency
        // User profile is already stored, no need to re-fetch on every page load
      }
    }
    this._initialized.set(true);
  }
}

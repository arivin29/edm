import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
      <div class="w-full max-w-md">
        <!-- Card -->
        <div class="bg-white rounded-lg shadow-lg p-8">
          <!-- Header -->
          <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <span class="text-2xl font-bold text-white">D</span>
            </div>
            <h1 class="text-2xl font-bold text-gray-900">Masuk ke DMS</h1>
            <p class="text-gray-500 mt-1">Document Management System</p>
          </div>

          <!-- Error -->
          @if (errorMessage()) {
            <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span class="text-sm">{{ errorMessage() }}</span>
            </div>
          }

          <!-- Login Mode Toggle -->
          @if (ssoEnabled()) {
            <div class="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
              <button
                class="flex-1 py-2 text-sm font-medium rounded-md transition"
                [class.bg-white]="loginMode() === 'standard'"
                [class.shadow-sm]="loginMode() === 'standard'"
                [class.text-blue-600]="loginMode() === 'standard'"
                [class.text-gray-500]="loginMode() !== 'standard'"
                (click)="loginMode.set('standard')"
              >Login Standar</button>
              <button
                class="flex-1 py-2 text-sm font-medium rounded-md transition"
                [class.bg-white]="loginMode() === 'sso'"
                [class.shadow-sm]="loginMode() === 'sso'"
                [class.text-purple-600]="loginMode() === 'sso'"
                [class.text-gray-500]="loginMode() !== 'sso'"
                (click)="loginMode.set('sso')"
              >Login SSO</button>
            </div>
          }

          @if (loginMode() === 'standard') {
            <!-- Standard Login Form -->
            <form (ngSubmit)="onSubmit()">
              <!-- Email -->
              <div class="mb-4">
                <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="nama@perusahaan.com"
                  [ngModel]="email()"
                  (ngModelChange)="email.set($event)"
                  [disabled]="isLoading()"
                  autocomplete="email"
                />
              </div>

              <!-- Password -->
              <div class="mb-4">
                <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div class="relative">
                  <input
                    [type]="showPassword() ? 'text' : 'password'"
                    id="password"
                    name="password"
                    class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition pr-10"
                    placeholder="Masukkan password"
                    [ngModel]="password()"
                    (ngModelChange)="password.set($event)"
                    [disabled]="isLoading()"
                    autocomplete="current-password"
                  />
                  <button
                    type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    (click)="togglePassword()"
                  >
                    @if (showPassword()) {
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                      </svg>
                    } @else {
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                    }
                  </button>
                </div>
              </div>

              <!-- Remember & Forgot -->
              <div class="flex items-center justify-between mb-6">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    [ngModel]="rememberMe()"
                    (ngModelChange)="rememberMe.set($event)"
                  />
                  <span class="text-sm text-gray-600">Ingat saya</span>
                </label>
                <a href="#" class="text-sm text-blue-600 hover:text-blue-700">Lupa password?</a>
              </div>

              <!-- Submit -->
              <button
                type="submit"
                class="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                [disabled]="isLoading()"
              >
                @if (isLoading()) {
                  <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <span>Memproses...</span>
                } @else {
                  <span>Masuk</span>
                }
              </button>
            </form>
          } @else {
            <!-- SSO Login Form -->
            <form (ngSubmit)="onSSOSubmit()">
              <div class="mb-4">
                <label for="ssoUsername" class="block text-sm font-medium text-gray-700 mb-1">Username / Email</label>
                <input
                  type="text"
                  id="ssoUsername"
                  name="ssoUsername"
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                  placeholder="username atau email@perusahaan.com"
                  [ngModel]="ssoUsername()"
                  (ngModelChange)="ssoUsername.set($event)"
                  [disabled]="isLoading()"
                  autocomplete="username"
                />
              </div>

              <div class="mb-6">
                <label for="ssoPassword" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div class="relative">
                  <input
                    [type]="showPassword() ? 'text' : 'password'"
                    id="ssoPassword"
                    name="ssoPassword"
                    class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition pr-10"
                    placeholder="Password Active Directory"
                    [ngModel]="ssoPassword()"
                    (ngModelChange)="ssoPassword.set($event)"
                    [disabled]="isLoading()"
                    autocomplete="current-password"
                  />
                  <button
                    type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    (click)="togglePassword()"
                  >
                    @if (showPassword()) {
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                      </svg>
                    } @else {
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                    }
                  </button>
                </div>
              </div>

              <button
                type="submit"
                class="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                [disabled]="isLoading()"
              >
                @if (isLoading()) {
                  <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <span>Memproses...</span>
                } @else {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                  <span>Masuk dengan SSO</span>
                }
              </button>

              <div class="mt-3 p-2 bg-purple-50 rounded text-xs text-purple-600 text-center">
                Login menggunakan akun Active Directory perusahaan
              </div>
            </form>
          }
        </div>

        <!-- Footer -->
        <p class="text-center text-gray-500 text-sm mt-6">
          &copy; 2026 PT Askara Internal. All rights reserved.
        </p>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class LoginPage implements OnInit {
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);

  // Standard login
  email = signal('admin@askara.com');
  password = signal('password123');
  rememberMe = signal(false);
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');

  // SSO
  ssoEnabled = signal(false);
  ssoProvider = signal('ldap');
  loginMode = signal<'standard' | 'sso'>('standard');
  ssoUsername = signal('');
  ssoPassword = signal('');

  ngOnInit() {
    this.checkSSOConfig();
  }

  checkSSOConfig() {
    this.http.get<any>(`${environment.apiUrl}/auth/sso/config`).subscribe({
      next: (res) => {
        this.ssoEnabled.set(res.data?.enabled || false);
        this.ssoProvider.set(res.data?.provider || 'ldap');
      },
      error: () => {}
    });
  }

  onSubmit(): void {
    this.errorMessage.set('');

    if (!this.email() || !this.password()) {
      this.errorMessage.set('Email dan password wajib diisi');
      return;
    }

    this.isLoading.set(true);
    this.authState.login(this.email(), this.password()).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error?.error?.message || 'Email atau password salah');
      }
    });
  }

  onSSOSubmit(): void {
    this.errorMessage.set('');

    if (!this.ssoUsername() || !this.ssoPassword()) {
      this.errorMessage.set('Username dan password wajib diisi');
      return;
    }

    this.isLoading.set(true);
    this.http.post<any>(`${environment.apiUrl}/auth/sso`, {
      provider: this.ssoProvider(),
      username: this.ssoUsername(),
      password: this.ssoPassword()
    }).subscribe({
      next: (res) => {
        const token = res.data?.token;
        if (token) {
          this.authState.setTokenAndUser(token, res.data?.user);
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
          this.router.navigateByUrl(returnUrl);
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error?.error?.error || 'Login SSO gagal');
      }
    });
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }
}

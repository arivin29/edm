import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { environment } from '../../../../environments/environment';

interface Session {
  id: string;
  ip_address: string;
  user_agent: string;
  last_activity: string;
  is_current: boolean;
  device?: string;
  location?: string;
}

@Component({
  selector: 'app-profile-security',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ReactiveFormsModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzProgressModule,
    NzSpinModule,
    NzTagModule,
    NzAlertModule,
    NzPopconfirmModule,
    NzToolTipModule,
    NzDividerModule,
  ],
  templateUrl: './profile-security.component.html',
  styleUrl: './profile-security.component.scss',
})
export class ProfileSecurityComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);

  submitting = signal(false);
  sessionsLoading = signal(false);
  sessions = signal<Session[]>([]);

  showCurrent = signal(false);
  showNew = signal(false);
  showConfirm = signal(false);

  passwordForm!: FormGroup;

  ngOnInit(): void {
    this.passwordForm = this.fb.group(
      {
        current_password: ['', [Validators.required]],
        new_password: ['', [Validators.required, Validators.minLength(8)]],
        new_password_confirmation: ['', [Validators.required]],
      },
      { validators: [this.matchValidator] }
    );
    this.loadSessions();
  }

  loadSessions(): void {
    this.sessionsLoading.set(true);
    this.http.get<{ data: Session[] }>(`${environment.apiUrl}/auth/sessions`).subscribe({
      next: (res) => {
        this.sessions.set(res.data || []);
        this.sessionsLoading.set(false);
      },
      error: () => {
        // sessions endpoint might not exist — silently ignore
        this.sessionsLoading.set(false);
      },
    });
  }

  revokeSession(id: string): void {
    this.http.delete(`${environment.apiUrl}/auth/sessions/${id}`).subscribe({
      next: () => {
        this.sessions.update((s) => s.filter((x) => x.id !== id));
        this.message.success('Sesi berhasil dicabut');
      },
      error: () => this.message.error('Gagal mencabut sesi'),
    });
  }

  revokeAllSessions(): void {
    this.http.delete(`${environment.apiUrl}/auth/sessions`).subscribe({
      next: () => {
        this.sessions.update((s) => s.filter((x) => x.is_current));
        this.message.success('Semua sesi lain berhasil dicabut');
      },
      error: () => this.message.error('Gagal mencabut sesi'),
    });
  }

  passwordStrength(): { percent: number; color: string; label: string; status: 'success' | 'normal' | 'exception' | 'active' } {
    const pw = this.passwordForm.get('new_password')?.value || '';
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (!pw) return { percent: 0, color: '#e0e0e0', label: '', status: 'normal' };
    if (score <= 1) return { percent: 20, color: '#ff4d4f', label: 'Lemah', status: 'exception' };
    if (score === 2) return { percent: 40, color: '#fa8c16', label: 'Cukup', status: 'normal' };
    if (score === 3) return { percent: 60, color: '#fadb14', label: 'Sedang', status: 'normal' };
    if (score === 4) return { percent: 80, color: '#52c41a', label: 'Kuat', status: 'success' };
    return { percent: 100, color: '#1677ff', label: 'Sangat Kuat', status: 'success' };
  }

  passwordRequirements(): { label: string; ok: boolean }[] {
    const pw = this.passwordForm.get('new_password')?.value || '';
    return [
      { label: 'Minimal 8 karakter', ok: pw.length >= 8 },
      { label: 'Huruf kapital (A-Z)', ok: /[A-Z]/.test(pw) },
      { label: 'Angka (0-9)', ok: /[0-9]/.test(pw) },
      { label: 'Karakter spesial (!@#...)', ok: /[^A-Za-z0-9]/.test(pw) },
    ];
  }

  submitPassword(): void {
    if (this.passwordForm.invalid) {
      Object.values(this.passwordForm.controls).forEach((c) => { c.markAsDirty(); c.updateValueAndValidity(); });
      return;
    }
    this.submitting.set(true);
    this.http.put<{ message: string }>(`${environment.apiUrl}/auth/password`, this.passwordForm.value).subscribe({
      next: (res) => {
        this.message.success(res.message || 'Password berhasil diubah');
        this.passwordForm.reset();
        this.submitting.set(false);
      },
      error: (err) => {
        this.message.error(err.error?.message || 'Gagal mengubah password');
        this.submitting.set(false);
      },
    });
  }

  getDeviceIcon(ua: string): string {
    if (!ua) return 'laptop';
    const l = ua.toLowerCase();
    if (l.includes('mobile') || l.includes('android') || l.includes('iphone')) return 'mobile';
    if (l.includes('tablet') || l.includes('ipad')) return 'tablet';
    return 'laptop';
  }

  getBrowserName(ua: string): string {
    if (!ua) return 'Unknown';
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Edg')) return 'Edge';
    return 'Browser';
  }

  private matchValidator(group: AbstractControl): ValidationErrors | null {
    const pw = group.get('new_password')?.value;
    const confirm = group.get('new_password_confirmation')?.value;
    if (pw && confirm && pw !== confirm) {
      group.get('new_password_confirmation')?.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }
}

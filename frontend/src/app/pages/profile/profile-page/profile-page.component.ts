import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzUploadModule, NzUploadFile } from 'ng-zorro-antd/upload';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { environment } from '../../../../environments/environment';
import { AuthStateService } from '../../../core/auth/auth-state.service';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  employee_id?: string;
  phone?: string;
  company_id?: string;
  office_id?: string;
  department_id?: string;
  section_id?: string;
  position_id?: string;
  avatar?: string;
  signature_image?: string;
  is_active?: boolean;
  roles?: any[];
  permissions?: string[];
  company?: { id: string; name: string };
  office?: { id: string; name: string };
  department?: { id: string; name: string };
  section?: { id: string; name: string };
  position?: { id: string; name: string };
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzCardModule,
    NzTabsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzAvatarModule,
    NzUploadModule,
    NzTagModule,
    NzDescriptionsModule,
    NzSpinModule,
    NzProgressModule,
    NzPopconfirmModule,
  ],
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
})
export class ProfilePage implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly authState = inject(AuthStateService);

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly profile = signal<ProfileData | null>(null);

  readonly showCurrent = signal(false);
  readonly showNew = signal(false);
  readonly showConfirm = signal(false);

  readonly passwordForm: FormGroup = this.fb.group(
    {
      current_password: ['', [Validators.required]],
      new_password: ['', [Validators.required, Validators.minLength(8)]],
      new_password_confirmation: ['', [Validators.required]],
    },
    { validators: [this.matchValidator] }
  );

  ngOnInit(): void {
    this.loadProfile();
  }

  // --- Profile ---

  loadProfile(): void {
    this.loading.set(true);
    this.http.get<{ data: ProfileData }>(`${environment.apiUrl}/auth/me`).subscribe({
      next: (res) => {
        this.profile.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.message.error('Gagal memuat profil');
        this.loading.set(false);
      },
    });
  }

  // --- Avatar ---

  getAvatarUploadUrl(): string {
    const id = this.profile()?.id;
    return id ? `${environment.apiUrl}/users/${id}/avatar` : '';
  }

  // --- Signature ---

  getSignatureUploadUrl(): string {
    const id = this.profile()?.id;
    return id ? `${environment.apiUrl}/users/${id}/signature` : '';
  }

  uploadHeaders(): Record<string, string> {
    return { Authorization: `Bearer ${this.authState.token()}` };
  }

  beforeImageUpload = (file: NzUploadFile): boolean => {
    const isImage = file.type?.startsWith('image/');
    if (!isImage) {
      this.message.error('Hanya file gambar yang diperbolehkan');
      return false;
    }
    const isLt2M = (file.size ?? 0) / 1024 / 1024 < 2;
    if (!isLt2M) {
      this.message.error('Ukuran file maksimal 2MB');
      return false;
    }
    return true;
  };

  onAvatarUpload(info: any): void {
    if (info.file.status === 'done') {
      const avatarUrl = info.file.response?.data?.avatar;
      if (avatarUrl) {
        this.profile.update((p) => (p ? { ...p, avatar: avatarUrl } : p));
        this.authState.loadUserProfile();
      }
      this.message.success('Foto profil berhasil diubah');
    } else if (info.file.status === 'error') {
      this.message.error('Gagal mengunggah foto');
    }
  }

  onSignatureUpload(info: any): void {
    if (info.file.status === 'done') {
      const sigUrl = info.file.response?.data?.signature_image;
      if (sigUrl) {
        this.profile.update((p) => (p ? { ...p, signature_image: sigUrl } : p));
      }
      this.message.success('Tanda tangan berhasil diunggah');
    } else if (info.file.status === 'error') {
      this.message.error('Gagal mengunggah tanda tangan');
    }
  }

  deleteSignature(): void {
    const id = this.profile()?.id;
    if (!id) return;
    this.http.delete<{ message: string }>(`${environment.apiUrl}/users/${id}/signature`).subscribe({
      next: () => {
        this.profile.update((p) => (p ? { ...p, signature_image: undefined } : p));
        this.message.success('Tanda tangan berhasil dihapus');
      },
      error: () => this.message.error('Gagal menghapus tanda tangan'),
    });
  }

  // --- Password ---

  passwordStrength(): { percent: number; color: string; label: string } {
    const pw = this.passwordForm.get('new_password')?.value || '';
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { percent: 20, color: '#f5222d', label: 'Lemah' };
    if (score === 2) return { percent: 40, color: '#fa8c16', label: 'Cukup' };
    if (score === 3) return { percent: 60, color: '#fadb14', label: 'Sedang' };
    if (score === 4) return { percent: 80, color: '#52c41a', label: 'Kuat' };
    return { percent: 100, color: '#1890ff', label: 'Sangat Kuat' };
  }

  submitPassword(): void {
    if (this.passwordForm.invalid) {
      Object.values(this.passwordForm.controls).forEach((c) => {
        c.markAsDirty();
        c.updateValueAndValidity();
      });
      return;
    }

    this.submitting.set(true);
    this.http
      .put<{ message: string }>(`${environment.apiUrl}/auth/password`, this.passwordForm.value)
      .subscribe({
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

  // --- Validators ---

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

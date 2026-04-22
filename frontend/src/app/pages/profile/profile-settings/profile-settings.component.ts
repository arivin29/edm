import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzUploadModule, NzUploadFile } from 'ng-zorro-antd/upload';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { environment } from '../../../../environments/environment';
import { AuthStateService } from '../../../core/auth/auth-state.service';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  employee_id?: string;
  phone?: string;
  avatar?: string;
}

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzAvatarModule,
    NzUploadModule,
    NzSpinModule,
    NzAlertModule,
    NzDividerModule,
  ],
  templateUrl: './profile-settings.component.html',
  styleUrl: './profile-settings.component.scss',
})
export class ProfileSettingsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly authState = inject(AuthStateService);

  loading = signal(false);
  submitting = signal(false);
  avatarUploading = signal(false);
  profile = signal<ProfileData | null>(null);
  previewAvatar = signal<string>('');

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      phone: [''],
      employee_id: [''],
    });
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);
    this.http.get<{ data: ProfileData }>(`${environment.apiUrl}/auth/me`).subscribe({
      next: (res) => {
        this.profile.set(res.data);
        this.previewAvatar.set(res.data.avatar || '');
        this.form.patchValue({
          name: res.data.name,
          phone: res.data.phone || '',
          employee_id: res.data.employee_id || '',
        });
        this.loading.set(false);
      },
      error: () => {
        this.message.error('Gagal memuat profil');
        this.loading.set(false);
      },
    });
  }

  getAvatarUploadUrl(): string {
    const id = this.profile()?.id;
    return id ? `${environment.apiUrl}/users/${id}/avatar` : '';
  }

  uploadHeaders(): Record<string, string> {
    return { Authorization: `Bearer ${this.authState.token()}` };
  }

  beforeImageUpload = (file: NzUploadFile): boolean => {
    const isImage = file.type?.startsWith('image/');
    if (!isImage) { this.message.error('Hanya file gambar yang diperbolehkan'); return false; }
    const isLt2M = (file.size ?? 0) / 1024 / 1024 < 2;
    if (!isLt2M) { this.message.error('Ukuran file maksimal 2MB'); return false; }
    return true;
  };

  onAvatarChange(info: any): void {
    if (info.file.status === 'uploading') {
      this.avatarUploading.set(true);
    }
    if (info.file.status === 'done') {
      this.avatarUploading.set(false);
      const avatarUrl = info.file.response?.data?.avatar;
      if (avatarUrl) {
        this.previewAvatar.set(avatarUrl);
        this.profile.update((p) => (p ? { ...p, avatar: avatarUrl } : p));
        this.authState.loadUserProfile();
      }
      this.message.success('Foto profil berhasil diubah');
    } else if (info.file.status === 'error') {
      this.avatarUploading.set(false);
      this.message.error('Gagal mengunggah foto');
    }
  }

  removeAvatar(): void {
    const id = this.profile()?.id;
    if (!id) return;
    this.http.delete(`${environment.apiUrl}/users/${id}/avatar`).subscribe({
      next: () => {
        this.previewAvatar.set('');
        this.profile.update((p) => (p ? { ...p, avatar: undefined } : p));
        this.authState.loadUserProfile();
        this.message.success('Foto profil dihapus');
      },
      error: () => this.message.error('Gagal menghapus foto'),
    });
  }

  submit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((c) => { c.markAsDirty(); c.updateValueAndValidity(); });
      return;
    }
    const id = this.profile()?.id;
    if (!id) return;

    this.submitting.set(true);
    this.http.put(`${environment.apiUrl}/users/${id}`, this.form.value).subscribe({
      next: () => {
        this.authState.loadUserProfile();
        this.message.success('Profil berhasil diperbarui');
        this.submitting.set(false);
      },
      error: (err) => {
        this.message.error(err.error?.message || 'Gagal memperbarui profil');
        this.submitting.set(false);
      },
    });
  }

  get initial(): string {
    return this.profile()?.name?.charAt(0)?.toUpperCase() || 'U';
  }
}

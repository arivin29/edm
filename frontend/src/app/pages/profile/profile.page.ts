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
import { environment } from '../../../environments/environment';
import { AuthStateService } from '../../core/auth/auth-state.service';

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
  template: `
    <div class="p-4">
      <nz-spin [nzSpinning]="loading()">
        <nz-tabset nzSize="small">
          <!-- Tab 1: Profil Saya -->
          <nz-tab nzTitle="Profil Saya">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-3">
              <!-- Avatar & Signature Column -->
              <div class="space-y-4">
                <!-- Avatar Card -->
                <nz-card nzSize="small" nzTitle="Foto Profil">
                  <div class="flex flex-col items-center gap-3">
                    <nz-avatar
                      [nzSize]="96"
                      [nzSrc]="profile()?.avatar || ''"
                      [nzText]="profile()?.name?.charAt(0)?.toUpperCase() || 'U'"
                      nzIcon="user"
                      class="cursor-pointer"
                      style="background-color: #1890ff; font-size: 36px;"
                    ></nz-avatar>
                    <nz-upload
                      [nzAction]="getAvatarUploadUrl()"
                      [nzHeaders]="uploadHeaders()"
                      nzName="avatar"
                      [nzShowUploadList]="false"
                      (nzChange)="onAvatarUpload($event)"
                      [nzBeforeUpload]="beforeImageUpload"
                    >
                      <button nz-button nzSize="small">
                        <nz-icon nzType="upload"></nz-icon> Ubah Foto
                      </button>
                    </nz-upload>
                  </div>
                </nz-card>

                <!-- Signature Card -->
                <nz-card nzSize="small" nzTitle="Tanda Tangan Digital">
                  <div class="flex flex-col items-center gap-3">
                    @if (profile()?.signature_image) {
                      <img
                        [src]="profile()!.signature_image"
                        alt="Tanda Tangan"
                        class="max-w-full h-auto border rounded"
                        style="max-height: 120px; background: #fff;"
                      />
                    } @else {
                      <div
                        class="flex items-center justify-center border-2 border-dashed rounded text-gray-400"
                        style="width: 200px; height: 80px;"
                      >
                        <span class="text-xs">Belum ada tanda tangan</span>
                      </div>
                    }
                    <div class="flex gap-2">
                      <nz-upload
                        [nzAction]="getSignatureUploadUrl()"
                        [nzHeaders]="uploadHeaders()"
                        nzName="signature"
                        [nzShowUploadList]="false"
                        (nzChange)="onSignatureUpload($event)"
                        [nzBeforeUpload]="beforeImageUpload"
                      >
                        <button nz-button nzSize="small">
                          <nz-icon nzType="upload"></nz-icon> Unggah
                        </button>
                      </nz-upload>
                      @if (profile()?.signature_image) {
                        <button
                          nz-button
                          nzSize="small"
                          nzDanger
                          nz-popconfirm
                          nzPopconfirmTitle="Hapus tanda tangan?"
                          (nzOnConfirm)="deleteSignature()"
                        >
                          <nz-icon nzType="delete"></nz-icon> Hapus
                        </button>
                      }
                    </div>
                  </div>
                </nz-card>
              </div>

              <!-- User Info Column -->
              <div class="lg:col-span-2">
                <nz-card nzSize="small" nzTitle="Informasi Pengguna">
                  <nz-descriptions nzSize="small" [nzColumn]="2" nzBordered>
                    <nz-descriptions-item nzTitle="Nama" [nzSpan]="2">
                      {{ profile()?.name || '-' }}
                    </nz-descriptions-item>
                    <nz-descriptions-item nzTitle="Email">
                      {{ profile()?.email || '-' }}
                    </nz-descriptions-item>
                    <nz-descriptions-item nzTitle="ID Karyawan">
                      {{ profile()?.employee_id || '-' }}
                    </nz-descriptions-item>
                    <nz-descriptions-item nzTitle="Telepon">
                      {{ profile()?.phone || '-' }}
                    </nz-descriptions-item>
                    <nz-descriptions-item nzTitle="Status">
                      @if (profile()?.is_active !== undefined) {
                        <nz-tag [nzColor]="profile()!.is_active ? 'green' : 'red'">
                          {{ profile()!.is_active ? 'Aktif' : 'Nonaktif' }}
                        </nz-tag>
                      } @else {
                        -
                      }
                    </nz-descriptions-item>
                  </nz-descriptions>
                </nz-card>

                <nz-card nzSize="small" nzTitle="Organisasi" class="mt-4">
                  <nz-descriptions nzSize="small" [nzColumn]="2" nzBordered>
                    <nz-descriptions-item nzTitle="Perusahaan" [nzSpan]="2">
                      {{ profile()?.company?.name || profile()?.company_id || '-' }}
                    </nz-descriptions-item>
                    <nz-descriptions-item nzTitle="Kantor">
                      {{ profile()?.office?.name || profile()?.office_id || '-' }}
                    </nz-descriptions-item>
                    <nz-descriptions-item nzTitle="Departemen">
                      {{ profile()?.department?.name || profile()?.department_id || '-' }}
                    </nz-descriptions-item>
                    <nz-descriptions-item nzTitle="Seksi">
                      {{ profile()?.section?.name || profile()?.section_id || '-' }}
                    </nz-descriptions-item>
                    <nz-descriptions-item nzTitle="Jabatan">
                      {{ profile()?.position?.name || profile()?.position_id || '-' }}
                    </nz-descriptions-item>
                  </nz-descriptions>
                </nz-card>

                <nz-card nzSize="small" nzTitle="Role" class="mt-4">
                  <div class="flex flex-wrap gap-1">
                    @for (role of profile()?.roles || []; track role) {
                      <nz-tag nzColor="blue">
                        {{ role?.name || role }}
                      </nz-tag>
                    }
                    @if (!profile()?.roles?.length) {
                      <span class="text-gray-400 text-xs">Tidak ada role</span>
                    }
                  </div>
                </nz-card>
              </div>
            </div>
          </nz-tab>

          <!-- Tab 2: Ubah Password -->
          <nz-tab nzTitle="Ubah Password">
            <div class="mt-3" style="max-width: 480px;">
              <nz-card nzSize="small" nzTitle="Ubah Password">
                <form
                  nz-form
                  [formGroup]="passwordForm"
                  (ngSubmit)="submitPassword()"
                  nzLayout="vertical"
                >
                  <nz-form-item>
                    <nz-form-label nzRequired>Password Lama</nz-form-label>
                    <nz-form-control [nzErrorTip]="currentPwdErr">
                      <nz-input-group [nzSuffix]="suffixCurrent" nzSize="small">
                        <input
                          nz-input
                          formControlName="current_password"
                          [type]="showCurrent() ? 'text' : 'password'"
                          placeholder="Masukkan password lama"
                        />
                      </nz-input-group>
                      <ng-template #currentPwdErr let-control>
                        @if (control.hasError('required')) { Password lama wajib diisi }
                      </ng-template>
                      <ng-template #suffixCurrent>
                        <nz-icon
                          [nzType]="showCurrent() ? 'eye' : 'eye-invisible'"
                          class="cursor-pointer"
                          (click)="showCurrent.set(!showCurrent())"
                        ></nz-icon>
                      </ng-template>
                    </nz-form-control>
                  </nz-form-item>

                  <nz-form-item>
                    <nz-form-label nzRequired>Password Baru</nz-form-label>
                    <nz-form-control [nzErrorTip]="newPwdErr">
                      <nz-input-group [nzSuffix]="suffixNew" nzSize="small">
                        <input
                          nz-input
                          formControlName="new_password"
                          [type]="showNew() ? 'text' : 'password'"
                          placeholder="Masukkan password baru"
                        />
                      </nz-input-group>
                      <ng-template #newPwdErr let-control>
                        @if (control.hasError('required')) { Password baru wajib diisi }
                        @else if (control.hasError('minlength')) { Minimal 8 karakter }
                      </ng-template>
                      <ng-template #suffixNew>
                        <nz-icon
                          [nzType]="showNew() ? 'eye' : 'eye-invisible'"
                          class="cursor-pointer"
                          (click)="showNew.set(!showNew())"
                        ></nz-icon>
                      </ng-template>
                    </nz-form-control>
                    <!-- Strength indicator -->
                    @if (passwordForm.get('new_password')?.value) {
                      <nz-progress
                        [nzPercent]="passwordStrength().percent"
                        [nzStrokeColor]="passwordStrength().color"
                        [nzShowInfo]="false"
                        nzSize="small"
                        class="mt-1"
                      ></nz-progress>
                      <span class="text-xs" [style.color]="passwordStrength().color">
                        {{ passwordStrength().label }}
                      </span>
                    }
                  </nz-form-item>

                  <nz-form-item>
                    <nz-form-label nzRequired>Konfirmasi Password</nz-form-label>
                    <nz-form-control [nzErrorTip]="confirmPwdErr">
                      <nz-input-group [nzSuffix]="suffixConfirm" nzSize="small">
                        <input
                          nz-input
                          formControlName="new_password_confirmation"
                          [type]="showConfirm() ? 'text' : 'password'"
                          placeholder="Ulangi password baru"
                        />
                      </nz-input-group>
                      <ng-template #confirmPwdErr let-control>
                        @if (control.hasError('required')) { Konfirmasi password wajib diisi }
                        @else if (control.hasError('mismatch')) { Password tidak cocok }
                      </ng-template>
                      <ng-template #suffixConfirm>
                        <nz-icon
                          [nzType]="showConfirm() ? 'eye' : 'eye-invisible'"
                          class="cursor-pointer"
                          (click)="showConfirm.set(!showConfirm())"
                        ></nz-icon>
                      </ng-template>
                    </nz-form-control>
                  </nz-form-item>

                  <nz-form-item>
                    <nz-form-control>
                      <button
                        nz-button
                        nzType="primary"
                        nzSize="small"
                        [nzLoading]="submitting()"
                        [disabled]="passwordForm.invalid"
                      >
                        <nz-icon nzType="lock"></nz-icon> Ubah Password
                      </button>
                    </nz-form-control>
                  </nz-form-item>
                </form>
              </nz-card>
            </div>
          </nz-tab>
        </nz-tabset>
      </nz-spin>
    </div>
  `,
  styles: [
    `
      :host ::ng-deep .ant-card-body {
        padding: 16px;
      }
      :host ::ng-deep .ant-form-item {
        margin-bottom: 16px;
      }
      :host ::ng-deep .ant-descriptions-item-label {
        font-size: 12px;
      }
      :host ::ng-deep .ant-descriptions-item-content {
        font-size: 13px;
      }
    `,
  ],
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

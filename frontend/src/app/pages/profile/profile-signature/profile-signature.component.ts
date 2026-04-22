import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzUploadModule, NzUploadFile } from 'ng-zorro-antd/upload';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { environment } from '../../../../environments/environment';
import { AuthStateService } from '../../../core/auth/auth-state.service';

@Component({
  selector: 'app-profile-signature',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzUploadModule,
    NzSpinModule,
    NzAlertModule,
    NzPopconfirmModule,
    NzDividerModule,
    NzTagModule,
  ],
  templateUrl: './profile-signature.component.html',
  styleUrl: './profile-signature.component.scss',
})
export class ProfileSignatureComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly message = inject(NzMessageService);
  private readonly authState = inject(AuthStateService);

  loading = signal(false);
  uploading = signal(false);
  userId = signal<string>('');
  signatureUrl = signal<string>('');

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);
    this.http.get<{ data: any }>(`${environment.apiUrl}/auth/me`).subscribe({
      next: (res) => {
        this.userId.set(res.data.id);
        this.signatureUrl.set(res.data.signature_image || '');
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getUploadUrl(): string {
    return this.userId() ? `${environment.apiUrl}/users/${this.userId()}/signature` : '';
  }

  uploadHeaders(): Record<string, string> {
    return { Authorization: `Bearer ${this.authState.token()}` };
  }

  beforeUpload = (file: NzUploadFile): boolean => {
    const ok = file.type?.startsWith('image/');
    if (!ok) { this.message.error('Hanya file gambar yang diperbolehkan (JPG, PNG, SVG)'); return false; }
    const lt2M = (file.size ?? 0) / 1024 / 1024 < 2;
    if (!lt2M) { this.message.error('Ukuran file maksimal 2MB'); return false; }
    return true;
  };

  onUploadChange(info: any): void {
    if (info.file.status === 'uploading') {
      this.uploading.set(true);
    }
    if (info.file.status === 'done') {
      this.uploading.set(false);
      const url = info.file.response?.data?.signature_image;
      if (url) this.signatureUrl.set(url);
      this.message.success('Tanda tangan berhasil diunggah');
    } else if (info.file.status === 'error') {
      this.uploading.set(false);
      this.message.error('Gagal mengunggah tanda tangan');
    }
  }

  deleteSignature(): void {
    this.http.delete(`${environment.apiUrl}/users/${this.userId()}/signature`).subscribe({
      next: () => {
        this.signatureUrl.set('');
        this.message.success('Tanda tangan berhasil dihapus');
      },
      error: () => this.message.error('Gagal menghapus tanda tangan'),
    });
  }
}

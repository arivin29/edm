import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { UserDetailService } from '../user-detail.service';

@Component({
  selector: 'app-user-activity-view',
  standalone: true,
  imports: [CommonModule, NzCardModule, NzIconModule, NzSpinModule, NzEmptyModule, NzTagModule],
  template: `
    <nz-card nzTitle="Riwayat Aktivitas" nzSize="small">
      <nz-spin [nzSpinning]="userService.activitiesLoading()">
        @if (userService.activities().length > 0) {
          <div class="activity-list">
            @for (item of userService.activities(); track item.id) {
              <div class="activity-item">
                <div class="activity-item__dot" [style.background]="getActionColor(item.action)">
                  <span nz-icon [nzType]="getActionIcon(item.action)"></span>
                </div>
                <div class="activity-item__body">
                  <div class="activity-item__header">
                    <span class="activity-item__action">{{ getActionLabel(item.action) }}</span>
                    <span class="activity-item__time">{{ item.created_at | date:'dd MMM yyyy, HH:mm' }}</span>
                  </div>
                  @if (item.description) {
                    <p class="activity-item__desc">{{ item.description }}</p>
                  }
                  <div class="activity-item__meta">
                    @if (item.ip_address) {
                      <nz-tag nzColor="default" class="activity-item__tag">
                        <span nz-icon nzType="global"></span> {{ item.ip_address }}
                      </nz-tag>
                    }
                    @if (item.user_agent) {
                      <nz-tag nzColor="default" class="activity-item__tag">
                        <span nz-icon nzType="laptop"></span> {{ parseUserAgent(item.user_agent) }}
                      </nz-tag>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        } @else {
          <nz-empty nzNotFoundContent="Belum ada aktivitas tercatat"></nz-empty>
        }
      </nz-spin>
    </nz-card>
  `,
  styles: [`
    .activity-list { @apply space-y-0; }
    .activity-item { @apply flex gap-3 py-4 border-b border-gray-100 last:border-0; }
    .activity-item__dot { @apply w-8 h-8 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0; }
    .activity-item__body { @apply flex-1 min-w-0; }
    .activity-item__header { @apply flex items-center justify-between gap-2 mb-1; }
    .activity-item__action { @apply text-sm font-medium text-gray-800; }
    .activity-item__time { @apply text-xs text-gray-400; }
    .activity-item__desc { @apply text-xs text-gray-600 m-0 mb-2; }
    .activity-item__meta { @apply flex flex-wrap gap-1; }
    .activity-item__tag { @apply text-[10px] flex items-center gap-1; }
  `]
})
export class UserActivityViewComponent implements OnInit {
  userService = inject(UserDetailService);

  ngOnInit() {
    this.userService.loadActivities();
  }

  getActionIcon(action: string): string {
    const icons: Record<string, string> = {
      'login': 'login',
      'logout': 'logout',
      'password_change': 'key',
      'profile_update': 'edit',
      'document_create': 'file-add',
      'document_update': 'file-sync',
      'document_approve': 'check-circle',
      'document_reject': 'close-circle',
    };
    return icons[action] || 'info-circle';
  }

  getActionColor(action: string): string {
    const colors: Record<string, string> = {
      'login': '#52c41a',
      'logout': '#faad14',
      'password_change': '#1890ff',
      'profile_update': '#1890ff',
      'document_create': '#52c41a',
      'document_approve': '#52c41a',
      'document_reject': '#ff4d4f',
    };
    return colors[action] || '#8c8c8c';
  }

  getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      'login': 'Login',
      'logout': 'Logout',
      'password_change': 'Ubah Password',
      'profile_update': 'Update Profil',
      'document_create': 'Buat Dokumen',
      'document_update': 'Update Dokumen',
      'document_approve': 'Setujui Dokumen',
      'document_reject': 'Tolak Dokumen',
    };
    return labels[action] || action;
  }

  parseUserAgent(ua: string): string {
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Browser';
  }
}

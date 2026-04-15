import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { AuthStateService } from '../../core/auth/auth-state.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NzCardModule,
    NzStatisticModule,
    NzGridModule,
    NzIconModule,
    NzButtonModule,
    NzTableModule,
    NzTagModule,
    NzTimelineModule
  ],
  template: `
    <div class="p-4">
      <!-- Page Header -->
      <div class="mb-4">
        <h1 class="text-xl font-semibold text-gray-900 m-0">Dashboard</h1>
        <p class="text-gray-500 text-sm m-0">Selamat datang, {{ authState.user()?.name || 'User' }}</p>
      </div>

      <!-- Stats -->
      <div nz-row [nzGutter]="12" class="mb-4">
        @for (stat of stats; track stat.title) {
          <div nz-col [nzSpan]="6" [nzXs]="12" [nzSm]="12" [nzMd]="6">
            <nz-card nzSize="small" class="stat-card">
              <div class="flex items-center gap-3">
                <div class="stat-icon" [style.background]="stat.bgColor">
                  <span nz-icon [nzType]="stat.icon" [style.color]="stat.color"></span>
                </div>
                <div>
                  <div class="text-2xl font-semibold" [style.color]="stat.color">{{ stat.value }}</div>
                  <div class="text-xs text-gray-500">{{ stat.title }}</div>
                </div>
              </div>
            </nz-card>
          </div>
        }
      </div>

      <!-- Quick Actions & Recent Documents -->
      <div nz-row [nzGutter]="12" class="mb-4">
        <div nz-col [nzSpan]="12" [nzXs]="24" [nzMd]="12">
          <nz-card nzSize="small" nzTitle="Aksi Cepat">
            <div class="grid grid-cols-2 gap-2">
              <button nz-button nzType="primary" nzSize="small" routerLink="/documents/create">
                <span nz-icon nzType="plus"></span>
                Buat Dokumen
              </button>
              <button nz-button nzSize="small" routerLink="/documents">
                <span nz-icon nzType="file-text"></span>
                Lihat Dokumen
              </button>
              <button nz-button nzSize="small" routerLink="/users">
                <span nz-icon nzType="team"></span>
                Kelola User
              </button>
              <button nz-button nzSize="small" routerLink="/settings">
                <span nz-icon nzType="setting"></span>
                Pengaturan
              </button>
            </div>
          </nz-card>
        </div>
        <div nz-col [nzSpan]="12" [nzXs]="24" [nzMd]="12">
          <nz-card nzSize="small" nzTitle="Dokumen Terbaru" [nzExtra]="extraTpl">
            <nz-table #docTable [nzData]="recentDocs" [nzShowPagination]="false" nzSize="small">
              <tbody>
                @for (doc of docTable.data; track doc.id) {
                  <tr>
                    <td>{{ doc.title }}</td>
                    <td>{{ doc.type }}</td>
                    <td>
                      <nz-tag [nzColor]="getStatusColor(doc.status)">{{ doc.status }}</nz-tag>
                    </td>
                  </tr>
                }
              </tbody>
            </nz-table>
          </nz-card>
          <ng-template #extraTpl>
            <a routerLink="/documents" class="text-xs">Lihat Semua</a>
          </ng-template>
        </div>
      </div>

      <!-- Activity Timeline -->
      <div nz-row>
        <div nz-col [nzSpan]="12" [nzXs]="24" [nzMd]="12">
          <nz-card nzSize="small" nzTitle="Aktivitas Terkini">
            <nz-timeline>
              @for (activity of activities; track activity.id) {
                <nz-timeline-item [nzColor]="activity.color">
                  <p class="m-0 text-sm">{{ activity.text }}</p>
                  <span class="text-xs text-gray-500">{{ activity.time }}</span>
                </nz-timeline-item>
              }
            </nz-timeline>
          </nz-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stat-card { border-radius: 6px; }
    .stat-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
    :host ::ng-deep .ant-card-head { padding: 0 12px; min-height: 40px; }
    :host ::ng-deep .ant-card-head-title { padding: 8px 0; font-size: 13px; }
    :host ::ng-deep .ant-card-body { padding: 12px; }
    :host ::ng-deep .ant-table-small .ant-table-tbody > tr > td { padding: 6px 8px; font-size: 12px; }
    :host ::ng-deep .ant-tag { font-size: 11px; line-height: 18px; padding: 0 6px; }
    :host ::ng-deep .ant-timeline-item-content { font-size: 13px; }
  `]
})
export class DashboardPage {
  readonly authState = inject(AuthStateService);

  stats = [
    { title: 'Total Dokumen', value: 1234, icon: 'file-text', color: '#1890ff', bgColor: '#e6f7ff' },
    { title: 'Menunggu Approval', value: 23, icon: 'clock-circle', color: '#faad14', bgColor: '#fff7e6' },
    { title: 'Disetujui Hari Ini', value: 8, icon: 'check-circle', color: '#52c41a', bgColor: '#f6ffed' },
    { title: 'Pengguna Aktif', value: 56, icon: 'team', color: '#722ed1', bgColor: '#f9f0ff' }
  ];

  recentDocs = [
    { id: 1, title: 'SOP Pengajuan Cuti', type: 'SOP', status: 'Disetujui' },
    { id: 2, title: 'Kontrak Kerja Baru', type: 'Kontrak', status: 'Menunggu' },
    { id: 3, title: 'Laporan Bulanan', type: 'Laporan', status: 'Draft' },
    { id: 4, title: 'Kebijakan Remote', type: 'Kebijakan', status: 'Disetujui' }
  ];

  activities = [
    { id: 1, text: 'Anda membuat dokumen baru: SOP Pengajuan Cuti', time: '5 menit lalu', color: 'blue' },
    { id: 2, text: 'Dokumen PKS-003 telah disetujui', time: '1 jam lalu', color: 'green' },
    { id: 3, text: 'Dokumen REG-012 diperbarui', time: '2 jam lalu', color: 'orange' },
    { id: 4, text: 'Komentar baru pada SOP-045', time: '3 jam lalu', color: 'gray' }
  ];

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'Disetujui': 'green',
      'Menunggu': 'orange',
      'Draft': 'default',
      'Ditolak': 'red'
    };
    return colors[status] || 'default';
  }
}

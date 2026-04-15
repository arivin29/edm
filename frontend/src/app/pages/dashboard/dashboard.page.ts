import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthStateService } from '../../core/auth/auth-state.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Selamat datang, {{ authState.user()?.name || 'User' }}</p>
        </div>
        <div class="header-date">
          <span class="text-gray-500">{{ currentDate.weekday }},</span>
          {{ currentDate.day }} {{ currentDate.month }} {{ currentDate.year }}
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        @for (stat of stats; track stat.label) {
          <div class="stat-card">
            <div class="stat-icon" [class]="stat.iconClass">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="stat.icon"/>
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-label">{{ stat.label }}</span>
              <span class="stat-value">{{ stat.value }}</span>
            </div>
          </div>
        }
      </div>

      <!-- Main Content Grid -->
      <div class="content-grid">
        <!-- Quick Actions -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Aksi Cepat</h2>
          </div>
          <div class="card-body">
            <div class="quick-actions">
              @for (action of quickActions; track action.label) {
                <a [routerLink]="action.link" class="quick-action">
                  <div class="quick-action-icon" [class]="action.iconClass">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="action.icon"/>
                    </svg>
                  </div>
                  <span class="quick-action-label">{{ action.label }}</span>
                </a>
              }
            </div>
          </div>
        </div>

        <!-- Recent Documents -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Dokumen Terbaru</h2>
            <a routerLink="/documents" class="text-sm text-primary-600 hover:text-primary-700">
              Lihat Semua →
            </a>
          </div>
          <div class="doc-list">
            @for (doc of recentDocs; track doc.id) {
              <div class="doc-item">
                <div class="doc-icon" [class]="getDocIconClass(doc.type)">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <div class="doc-info">
                  <span class="doc-title">{{ doc.title }}</span>
                  <span class="doc-meta">{{ doc.type }} • {{ doc.date }}</span>
                </div>
                <span class="doc-status" [class]="getStatusClass(doc.status)">
                  {{ doc.status }}
                </span>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Activity -->
      <div class="card activity-card">
        <div class="card-header">
          <h2 class="card-title">Aktivitas Terkini</h2>
        </div>
        <div class="activity-list">
          @for (activity of activities; track activity.id) {
            <div class="activity-item">
              <div class="activity-dot" [class]="activity.type"></div>
              <div class="activity-content">
                <p class="activity-text">{{ activity.text }}</p>
                <span class="activity-time">{{ activity.time }}</span>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      @apply p-6;
    }

    .page-header {
      @apply flex items-center justify-between mb-6;
    }

    .page-title {
      @apply text-2xl font-semibold text-gray-900;
    }

    .page-subtitle {
      @apply text-sm text-gray-500 mt-1;
    }

    .header-date {
      @apply text-sm text-gray-500;
    }

    .stats-grid {
      @apply grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6;
    }

    .stat-card {
      @apply bg-white rounded-lg shadow p-4 flex items-center gap-4;
    }

    .stat-icon {
      @apply w-12 h-12 rounded-lg flex items-center justify-center;
      &.primary { @apply bg-blue-100 text-blue-600; }
      &.warning { @apply bg-yellow-100 text-yellow-600; }
      &.success { @apply bg-green-100 text-green-600; }
      &.info { @apply bg-indigo-100 text-indigo-600; }
    }

    .stat-content {
      @apply flex flex-col;
    }

    .stat-label {
      @apply text-xs text-gray-500 uppercase tracking-wider;
    }

    .stat-value {
      @apply text-2xl font-semibold text-gray-900;
    }

    .content-grid {
      @apply grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6;
    }

    .card {
      @apply bg-white rounded-lg shadow;
    }

    .card-header {
      @apply flex items-center justify-between px-4 py-3 border-b border-gray-100;
    }

    .card-title {
      @apply text-base font-medium text-gray-900;
    }

    .card-body {
      @apply p-4;
    }

    .quick-actions {
      @apply grid grid-cols-2 gap-3;
    }

    .quick-action {
      @apply flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors no-underline;
    }

    .quick-action-icon {
      @apply w-10 h-10 rounded-lg flex items-center justify-center text-white;
      &.primary { @apply bg-blue-500; }
      &.success { @apply bg-green-500; }
      &.warning { @apply bg-yellow-500; }
      &.gray { @apply bg-gray-500; }
    }

    .quick-action-label {
      @apply text-sm font-medium text-gray-700;
    }

    .doc-list {
      @apply divide-y divide-gray-100;
    }

    .doc-item {
      @apply flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer;
    }

    .doc-icon {
      @apply w-8 h-8 rounded-lg flex items-center justify-center;
      &.sop { @apply bg-blue-100 text-blue-600; }
      &.kontrak { @apply bg-green-100 text-green-600; }
      &.laporan { @apply bg-yellow-100 text-yellow-600; }
      &.kebijakan { @apply bg-indigo-100 text-indigo-600; }
    }

    .doc-info {
      @apply flex-1 flex flex-col min-w-0;
    }

    .doc-title {
      @apply text-sm font-medium text-gray-900 truncate;
    }

    .doc-meta {
      @apply text-xs text-gray-500;
    }

    .doc-status {
      @apply px-2 py-1 rounded-full text-xs font-medium;
      &.approved { @apply bg-green-100 text-green-700; }
      &.pending { @apply bg-yellow-100 text-yellow-700; }
      &.draft { @apply bg-gray-100 text-gray-600; }
      &.rejected { @apply bg-red-100 text-red-700; }
    }

    .activity-card {
      @apply max-w-2xl;
    }

    .activity-list {
      @apply p-4 space-y-3;
    }

    .activity-item {
      @apply flex gap-3;
    }

    .activity-dot {
      @apply w-2 h-2 rounded-full mt-2 flex-shrink-0;
      &.create { @apply bg-blue-500; }
      &.approve { @apply bg-green-500; }
      &.update { @apply bg-yellow-500; }
      &.comment { @apply bg-indigo-500; }
    }

    .activity-content {
      @apply flex-1;
    }

    .activity-text {
      @apply text-sm text-gray-700 m-0;
    }

    .activity-time {
      @apply text-xs text-gray-500;
    }

    @media (max-width: 640px) {
      .page-header {
        @apply flex-col items-start gap-2;
      }
      .quick-actions {
        @apply grid-cols-1;
      }
    }
  `]
})
export class DashboardPage implements OnInit {
  readonly authState = inject(AuthStateService);

  currentDate = {
    day: '',
    weekday: '',
    month: '',
    year: ''
  };

  stats = [
    {
      label: 'Total Dokumen',
      value: '1,234',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      iconClass: 'primary'
    },
    {
      label: 'Menunggu Approval',
      value: '23',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      iconClass: 'warning'
    },
    {
      label: 'Disetujui Hari Ini',
      value: '8',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      iconClass: 'success'
    },
    {
      label: 'Pengguna Aktif',
      value: '56',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
      iconClass: 'info'
    }
  ];

  quickActions = [
    {
      label: 'Buat Dokumen',
      link: '/documents/create',
      icon: 'M12 4v16m8-8H4',
      iconClass: 'primary'
    },
    {
      label: 'Lihat Dokumen',
      link: '/documents',
      icon: 'M4 6h16M4 10h16M4 14h16M4 18h16',
      iconClass: 'success'
    },
    {
      label: 'Kelola User',
      link: '/users',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m9 5.197v1',
      iconClass: 'warning'
    },
    {
      label: 'Pengaturan',
      link: '/settings',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
      iconClass: 'gray'
    }
  ];

  recentDocs = [
    { id: 1, title: 'SOP Pengajuan Cuti', type: 'SOP', date: '15 Apr 2026', status: 'Disetujui' },
    { id: 2, title: 'Kontrak Kerja Baru', type: 'Kontrak', date: '14 Apr 2026', status: 'Menunggu' },
    { id: 3, title: 'Laporan Bulanan', type: 'Laporan', date: '13 Apr 2026', status: 'Draft' },
    { id: 4, title: 'Kebijakan Remote Work', type: 'Kebijakan', date: '12 Apr 2026', status: 'Disetujui' }
  ];

  activities = [
    { id: 1, type: 'create', text: 'Anda membuat dokumen baru: SOP Pengajuan Cuti', time: '5 menit lalu' },
    { id: 2, type: 'approve', text: 'Dokumen PKS-003 telah disetujui', time: '1 jam lalu' },
    { id: 3, type: 'update', text: 'Dokumen REG-012 diperbarui', time: '2 jam lalu' },
    { id: 4, type: 'comment', text: 'Komentar baru pada SOP-045', time: '3 jam lalu' }
  ];

  ngOnInit(): void {
    this.updateCurrentDate();
  }

  updateCurrentDate(): void {
    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    this.currentDate = {
      day: now.getDate().toString(),
      weekday: days[now.getDay()],
      month: months[now.getMonth()],
      year: now.getFullYear().toString()
    };
  }

  getDocIconClass(type: string): string {
    const typeMap: Record<string, string> = {
      'SOP': 'sop',
      'Kontrak': 'kontrak',
      'Laporan': 'laporan',
      'Kebijakan': 'kebijakan'
    };
    return typeMap[type] || 'sop';
  }

  getStatusClass(status: string): string {
    const statusMap: Record<string, string> = {
      'Disetujui': 'approved',
      'Menunggu': 'pending',
      'Draft': 'draft',
      'Ditolak': 'rejected'
    };
    return statusMap[status] || 'draft';
  }
}

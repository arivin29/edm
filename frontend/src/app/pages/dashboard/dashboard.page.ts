import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin, catchError, of } from 'rxjs';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { environment } from '../../../environments/environment';

interface DashboardDoc {
  id: string;
  document_number: string;
  title: string;
  status: string;
  created_at: string;
  creator?: { name: string };
}

interface PendingTask {
  document_id: string;
  document_title: string;
  document_number: string;
  step_name: string;
  assignee_name: string;
  deadline: string;
  created_at: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  document_id: string;
  is_read: boolean;
  created_at: string;
}

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
    NzTimelineModule,
    NzSpinModule,
    NzEmptyModule
  ],
  template: `
    <div class="p-4">
      <!-- Page Header -->
      <div class="mb-4">
        <h1 class="text-xl font-semibold text-gray-900 m-0">Dashboard</h1>
        <p class="text-gray-500 text-sm m-0">Selamat datang, {{ authState.user()?.name || 'User' }}</p>
      </div>

      <!-- Stats -->
      <nz-spin [nzSpinning]="loadingStats()">
        <div nz-row [nzGutter]="12" class="mb-4">
          @for (stat of stats(); track stat.title) {
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
      </nz-spin>

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
            <nz-spin [nzSpinning]="loadingDocs()">
              @if (recentDocs().length === 0 && !loadingDocs()) {
                <nz-empty nzNotFoundContent="Belum ada dokumen"></nz-empty>
              } @else {
                <nz-table #docTable [nzData]="recentDocs()" [nzShowPagination]="false" nzSize="small">
                  <tbody>
                    @for (doc of docTable.data; track doc.id) {
                      <tr>
                        <td>
                          <a [routerLink]="['/documents', doc.id]" class="text-xs font-medium">{{ doc.title }}</a>
                          <div class="text-xs text-gray-400">{{ doc.document_number }}</div>
                        </td>
                        <td>
                          <nz-tag [nzColor]="getStatusColor(doc.status)">{{ getStatusLabel(doc.status) }}</nz-tag>
                        </td>
                        <td class="text-xs text-gray-500">{{ doc.creator?.name || '-' }}</td>
                        <td class="text-xs text-gray-400">{{ doc.created_at | date:'dd/MM/yy' }}</td>
                      </tr>
                    }
                  </tbody>
                </nz-table>
              }
            </nz-spin>
          </nz-card>
          <ng-template #extraTpl>
            <a routerLink="/documents" class="text-xs">Lihat Semua</a>
          </ng-template>
        </div>
      </div>

      <!-- Pending Tasks & Activity Timeline -->
      <div nz-row [nzGutter]="12">
        <div nz-col [nzSpan]="12" [nzXs]="24" [nzMd]="12">
          <nz-card nzSize="small" nzTitle="Tugas Menunggu">
            <nz-spin [nzSpinning]="loadingTasks()">
              @if (pendingTasks().length === 0 && !loadingTasks()) {
                <nz-empty nzNotFoundContent="Tidak ada tugas menunggu"></nz-empty>
              } @else {
                <nz-table #taskTable [nzData]="pendingTasks()" [nzShowPagination]="false" nzSize="small">
                  <tbody>
                    @for (task of taskTable.data; track task.document_id) {
                      <tr>
                        <td>
                          <a [routerLink]="['/documents', task.document_id]" class="text-xs font-medium">{{ task.document_title }}</a>
                          <div class="text-xs text-gray-400">{{ task.document_number }}</div>
                        </td>
                        <td>
                          <nz-tag nzColor="processing">{{ task.step_name }}</nz-tag>
                        </td>
                        <td class="text-xs text-gray-400">
                          @if (task.deadline) {
                            {{ task.deadline | date:'dd/MM/yy' }}
                          } @else {
                            -
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </nz-table>
              }
            </nz-spin>
          </nz-card>
        </div>
        <div nz-col [nzSpan]="12" [nzXs]="24" [nzMd]="12">
          <nz-card nzSize="small" nzTitle="Aktivitas Terkini">
            <nz-spin [nzSpinning]="loadingActivities()">
              @if (activities().length === 0 && !loadingActivities()) {
                <nz-empty nzNotFoundContent="Belum ada aktivitas"></nz-empty>
              } @else {
                <nz-timeline>
                  @for (activity of activities(); track activity.id) {
                    <nz-timeline-item [nzColor]="getNotificationColor(activity.type)">
                      <p class="m-0 text-sm">{{ activity.title }}</p>
                      <p class="m-0 text-xs text-gray-600">{{ activity.message }}</p>
                      <span class="text-xs text-gray-400">{{ activity.created_at | date:'dd/MM/yy HH:mm' }}</span>
                    </nz-timeline-item>
                  }
                </nz-timeline>
              }
            </nz-spin>
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
export class DashboardPage implements OnInit {
  private readonly http = inject(HttpClient);
  readonly authState = inject(AuthStateService);
  private readonly apiUrl = environment.apiUrl;

  loadingStats = signal(true);
  loadingDocs = signal(true);
  loadingTasks = signal(true);
  loadingActivities = signal(true);

  stats = signal([
    { title: 'Total Dokumen', value: 0, icon: 'file-text', color: '#1890ff', bgColor: '#e6f7ff' },
    { title: 'Menunggu Approval', value: 0, icon: 'clock-circle', color: '#faad14', bgColor: '#fff7e6' },
    { title: 'Pending Tasks', value: 0, icon: 'check-circle', color: '#52c41a', bgColor: '#f6ffed' },
    { title: 'Total Pengguna', value: 0, icon: 'team', color: '#722ed1', bgColor: '#f9f0ff' }
  ]);

  recentDocs = signal<DashboardDoc[]>([]);
  pendingTasks = signal<PendingTask[]>([]);
  activities = signal<Notification[]>([]);

  ngOnInit(): void {
    this.loadStats();
    this.loadRecentDocs();
    this.loadPendingTasks();
    this.loadActivities();
  }

  private loadStats(): void {
    const empty = { data: [], meta: { total: 0 } };

    forkJoin({
      docs: this.http.get<any>(`${this.apiUrl}/documents`, {
        params: { per_page: '1' }
      }).pipe(catchError(() => of(empty))),
      inReview: this.http.get<any>(`${this.apiUrl}/documents`, {
        params: { status: 'in_review', per_page: '1' }
      }).pipe(catchError(() => of(empty))),
      pending: this.http.get<any>(`${this.apiUrl}/workflow/pending-tasks`).pipe(
        catchError(() => of({ data: [] }))
      ),
      users: this.http.get<any>(`${this.apiUrl}/users`, {
        params: { per_page: '1' }
      }).pipe(catchError(() => of(empty)))
    }).subscribe({
      next: (res) => {
        this.stats.set([
          { title: 'Total Dokumen', value: res.docs?.meta?.total ?? 0, icon: 'file-text', color: '#1890ff', bgColor: '#e6f7ff' },
          { title: 'Menunggu Approval', value: res.inReview?.meta?.total ?? 0, icon: 'clock-circle', color: '#faad14', bgColor: '#fff7e6' },
          { title: 'Pending Tasks', value: res.pending?.data?.length ?? 0, icon: 'check-circle', color: '#52c41a', bgColor: '#f6ffed' },
          { title: 'Total Pengguna', value: res.users?.meta?.total ?? 0, icon: 'team', color: '#722ed1', bgColor: '#f9f0ff' }
        ]);
        this.loadingStats.set(false);
      },
      error: () => this.loadingStats.set(false)
    });
  }

  private loadRecentDocs(): void {
    this.http.get<any>(`${this.apiUrl}/documents`, {
      params: { per_page: '5', sort_by: 'created_at', sort_dir: 'desc' }
    }).pipe(catchError(() => of({ data: [] }))).subscribe({
      next: (res) => {
        this.recentDocs.set(res.data ?? []);
        this.loadingDocs.set(false);
      },
      error: () => this.loadingDocs.set(false)
    });
  }

  private loadPendingTasks(): void {
    this.http.get<any>(`${this.apiUrl}/workflow/pending-tasks`).pipe(
      catchError(() => of({ data: [] }))
    ).subscribe({
      next: (res) => {
        this.pendingTasks.set(res.data ?? []);
        this.loadingTasks.set(false);
      },
      error: () => this.loadingTasks.set(false)
    });
  }

  private loadActivities(): void {
    this.http.get<any>(`${this.apiUrl}/notifications`, {
      params: { per_page: '5' }
    }).pipe(catchError(() => of({ data: [] }))).subscribe({
      next: (res) => {
        this.activities.set(res.data ?? []);
        this.loadingActivities.set(false);
      },
      error: () => this.loadingActivities.set(false)
    });
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      draft: 'default',
      in_review: 'orange',
      approved: 'green',
      rejected: 'red',
      archived: 'gray'
    };
    return colors[status] || 'default';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Draft',
      in_review: 'Menunggu',
      approved: 'Disetujui',
      rejected: 'Ditolak',
      archived: 'Diarsipkan'
    };
    return labels[status] || status;
  }

  getNotificationColor(type: string): string {
    const colors: Record<string, string> = {
      document_created: 'blue',
      document_approved: 'green',
      document_rejected: 'red',
      document_submitted: 'orange',
      task_assigned: 'purple',
      comment_added: 'gray'
    };
    return colors[type] || 'blue';
  }
}

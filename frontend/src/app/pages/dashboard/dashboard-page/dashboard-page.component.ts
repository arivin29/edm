import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { AuthStateService } from '../../../core/auth/auth-state.service';
import { environment } from '../../../../environments/environment';

interface DashboardDoc {
  id: string;
  document_number: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  creator?: { name: string };
  document_type?: { name: string; code: string };
  department?: { name: string };
}

interface PendingTask {
  document_id: string;
  document_title: string;
  document_number: string;
  step_name: string;
  action_type: string;
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

interface StatusCount {
  status: string;
  count: number;
  label: string;
  color: string;
  bgColor: string;
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
    NzEmptyModule,
    NzToolTipModule,
    NzAvatarModule
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss']
})
export class DashboardPage implements OnInit {
  private readonly http = inject(HttpClient);
  readonly authState = inject(AuthStateService);
  private readonly apiUrl = environment.apiUrl;

  today = new Date();

  loadingStats = signal(true);
  loadingDocs = signal(true);
  loadingTasks = signal(true);
  loadingActivities = signal(true);
  loadingStatusBreakdown = signal(true);
  loadingTypeBreakdown = signal(true);

  stats = signal<{ key: string; title: string; value: number; icon: string; color: string; bgColor: string; route: string; queryParams?: any }[]>([
    { key: 'total', title: 'Total Dokumen', value: 0, icon: 'file-text', color: '#0284c7', bgColor: '#e0f2fe', route: '/documents' },
    { key: 'mytask', title: 'Tugas Saya', value: 0, icon: 'bell', color: '#dc2626', bgColor: '#fee2e2', route: '/documents' },
    { key: 'review', title: 'Menunggu Review', value: 0, icon: 'clock-circle', color: '#d97706', bgColor: '#fef3c7', route: '/documents', queryParams: { status: 'in_review' } },
    { key: 'mydocs', title: 'Dokumen Saya', value: 0, icon: 'user', color: '#7c3aed', bgColor: '#ede9fe', route: '/documents' },
    { key: 'users', title: 'Total Pengguna', value: 0, icon: 'team', color: '#059669', bgColor: '#d1fae5', route: '/users' },
  ]);

  recentDocs = signal<DashboardDoc[]>([]);
  pendingTasks = signal<PendingTask[]>([]);
  activities = signal<Notification[]>([]);
  statusBreakdown = signal<StatusCount[]>([]);
  typeBreakdown = signal<{ name: string; code: string; count: number }[]>([]);

  ngOnInit(): void {
    this.loadStats();
    this.loadRecentDocs();
    this.loadPendingTasks();
    this.loadActivities();
    if (this.isAdmin()) {
      this.loadStatusBreakdown();
      this.loadTypeBreakdown();
    }
  }

  isAdmin(): boolean {
    return this.authState.hasAnyRole(['admin', 'super_admin', 'manager']);
  }

  getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Selamat Pagi';
    if (h < 15) return 'Selamat Siang';
    if (h < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  }

  isUrgent(deadline: string): boolean {
    if (!deadline) return false;
    const diff = new Date(deadline).getTime() - Date.now();
    return diff < 86400000 * 2; // < 2 days
  }

  formatTimeAgo(dateStr: string): string {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Baru saja';
    if (mins < 60) return `${mins} menit lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} hari lalu`;
    return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
  }

  getBarWidth(count: number): number {
    const max = Math.max(...this.statusBreakdown().map(s => s.count), 1);
    return (count / max) * 100;
  }

  getTotalDocs(): number {
    return this.statusBreakdown().reduce((sum, s) => sum + s.count, 0);
  }

  private loadStats(): void {
    const empty = { data: [], meta: { total: 0 } };

    forkJoin({
      docs: this.http.get<any>(`${this.apiUrl}/documents`, { params: { per_page: '1' } }).pipe(catchError(() => of(empty))),
      inReview: this.http.get<any>(`${this.apiUrl}/documents`, { params: { status: 'in_review', per_page: '1' } }).pipe(catchError(() => of(empty))),
      pending: this.http.get<any>(`${this.apiUrl}/workflow/pending-tasks`).pipe(catchError(() => of({ data: [] }))),
      myDocs: this.http.get<any>(`${this.apiUrl}/documents`, { params: { created_by: 'me', per_page: '1' } }).pipe(catchError(() => of(empty))),
      users: this.http.get<any>(`${this.apiUrl}/users`, { params: { per_page: '1' } }).pipe(catchError(() => of(empty)))
    }).subscribe({
      next: (res) => {
        this.stats.set([
          { key: 'total', title: 'Total Dokumen', value: res.docs?.meta?.total ?? 0, icon: 'file-text', color: '#0284c7', bgColor: '#e0f2fe', route: '/documents' },
          { key: 'mytask', title: 'Tugas Saya', value: res.pending?.data?.length ?? 0, icon: 'bell', color: '#dc2626', bgColor: '#fee2e2', route: '/documents' },
          { key: 'review', title: 'Menunggu Review', value: res.inReview?.meta?.total ?? 0, icon: 'clock-circle', color: '#d97706', bgColor: '#fef3c7', route: '/documents', queryParams: { status: 'in_review' } },
          { key: 'mydocs', title: 'Dokumen Saya', value: res.myDocs?.meta?.total ?? 0, icon: 'user', color: '#7c3aed', bgColor: '#ede9fe', route: '/documents' },
          { key: 'users', title: 'Total Pengguna', value: res.users?.meta?.total ?? 0, icon: 'team', color: '#059669', bgColor: '#d1fae5', route: '/users' },
        ]);
        this.loadingStats.set(false);
      },
      error: () => this.loadingStats.set(false)
    });
  }

  private loadRecentDocs(): void {
    this.http.get<any>(`${this.apiUrl}/documents`, {
      params: { per_page: '7', sort_by: 'created_at', sort_dir: 'desc' }
    }).pipe(catchError(() => of({ data: [] }))).subscribe({
      next: (res) => { this.recentDocs.set(res.data ?? []); this.loadingDocs.set(false); },
      error: () => this.loadingDocs.set(false)
    });
  }

  private loadPendingTasks(): void {
    this.http.get<any>(`${this.apiUrl}/workflow/pending-tasks`).pipe(
      catchError(() => of({ data: [] }))
    ).subscribe({
      next: (res) => { this.pendingTasks.set(res.data ?? []); this.loadingTasks.set(false); },
      error: () => this.loadingTasks.set(false)
    });
  }

  private loadActivities(): void {
    this.http.get<any>(`${this.apiUrl}/notifications`, {
      params: { per_page: '8' }
    }).pipe(catchError(() => of({ data: [] }))).subscribe({
      next: (res) => { this.activities.set(res.data ?? []); this.loadingActivities.set(false); },
      error: () => this.loadingActivities.set(false)
    });
  }

  private loadStatusBreakdown(): void {
    const statuses = ['draft', 'in_review', 'approved', 'revision', 'final', 'obsolete'];
    const colors: Record<string, { color: string; bgColor: string; label: string }> = {
      draft: { color: '#a1a1aa', bgColor: '#f4f4f5', label: 'Draft' },
      in_review: { color: '#3b82f6', bgColor: '#dbeafe', label: 'Dalam Review' },
      approved: { color: '#22c55e', bgColor: '#dcfce7', label: 'Disetujui' },
      revision: { color: '#f59e0b', bgColor: '#fef3c7', label: 'Revisi' },
      final: { color: '#6366f1', bgColor: '#e0e7ff', label: 'Final' },
      obsolete: { color: '#ef4444', bgColor: '#fee2e2', label: 'Usang' },
    };

    forkJoin(
      statuses.map(s =>
        this.http.get<any>(`${this.apiUrl}/documents`, { params: { status: s, per_page: '1' } }).pipe(
          catchError(() => of({ meta: { total: 0 } }))
        )
      )
    ).subscribe({
      next: (results) => {
        this.statusBreakdown.set(
          statuses.map((s, i) => ({
            status: s,
            count: results[i]?.meta?.total ?? 0,
            label: colors[s].label,
            color: colors[s].color,
            bgColor: colors[s].bgColor,
          })).filter(s => s.count > 0)
        );
        this.loadingStatusBreakdown.set(false);
      },
      error: () => this.loadingStatusBreakdown.set(false)
    });
  }

  private loadTypeBreakdown(): void {
    this.http.get<any>(`${this.apiUrl}/document-types`).pipe(
      catchError(() => of({ data: [] }))
    ).subscribe({
      next: (res) => {
        const types = res.data ?? [];
        if (types.length === 0) {
          this.typeBreakdown.set([]);
          this.loadingTypeBreakdown.set(false);
          return;
        }
        forkJoin(
          types.map((t: any) =>
            this.http.get<any>(`${this.apiUrl}/documents`, { params: { type_id: t.id, per_page: '1' } }).pipe(
              catchError(() => of({ meta: { total: 0 } }))
            )
          )
        ).subscribe({
          next: (counts) => {
            const results = counts as any[];
            this.typeBreakdown.set(
              types.map((t: any, i: number) => ({
                name: t.name,
                code: t.code,
                count: (results[i] as any)?.meta?.total ?? 0
              })).sort((a: any, b: any) => b.count - a.count)
            );
            this.loadingTypeBreakdown.set(false);
          },
          error: () => this.loadingTypeBreakdown.set(false)
        });
      },
      error: () => this.loadingTypeBreakdown.set(false)
    });
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      draft: 'default', in_review: 'orange', approved: 'green',
      rejected: 'red', archived: 'gray', revision: 'warning',
      final: 'blue', obsolete: 'error'
    };
    return colors[status] || 'default';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Draft', in_review: 'Review', revision: 'Revisi',
      approved: 'Disetujui', final: 'Final', obsolete: 'Usang', archived: 'Diarsipkan'
    };
    return labels[status] || status;
  }

  getNotificationColor(type: string): string {
    const colors: Record<string, string> = {
      document_created: 'blue', document_approved: 'green',
      document_rejected: 'red', document_submitted: 'orange',
      task_assigned: 'purple', comment_added: 'gray'
    };
    return colors[type] || 'blue';
  }
}

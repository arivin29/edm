import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSegmentedModule } from 'ng-zorro-antd/segmented';
import { Router } from '@angular/router';
import {
  AppNotificationService,
  AppNotification,
  PaginationMeta,
} from '../../core/services/app-notification.service';
import { Subscription } from 'rxjs';

type FilterStatus = 'all' | 'unread' | 'read';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzListModule,
    NzButtonModule,
    NzIconModule,
    NzEmptyModule,
    NzTagModule,
    NzSpinModule,
    NzPaginationModule,
    NzPopconfirmModule,
    NzSegmentedModule,
  ],
  template: `
    <div class="notification-page">
      <div class="page-header">
        <h2>Notifikasi</h2>
        <div class="header-actions">
          <button nz-button nzType="default" nzSize="small"
                  *ngIf="notifService.unreadCount() > 0"
                  (click)="markAllRead()">
            <span nz-icon nzType="check" nzTheme="outline"></span>
            Tandai Semua Dibaca
          </button>
        </div>
      </div>

      <div class="filter-bar">
        <nz-segmented
          [nzOptions]="filterOptions"
          [ngModel]="filterIndex()"
          (nzValueChange)="onFilterChange($event)">
        </nz-segmented>
      </div>

      <nz-spin [nzSpinning]="loading()">
        <nz-list *ngIf="filteredNotifications().length > 0; else emptyTpl"
                 [nzItemLayout]="'horizontal'">
          <nz-list-item *ngFor="let n of filteredNotifications()">
            <div class="notif-row" [class.unread]="!n.is_read" (click)="onNotificationClick(n)">
              <div class="notif-icon">
                <span nz-icon [nzType]="getIcon(n.type)" nzTheme="outline"
                      [class]="getIconColor(n.type)"></span>
              </div>
              <div class="notif-body">
                <div class="notif-title">
                  {{ n.title }}
                  <nz-tag *ngIf="!n.is_read" nzColor="blue">Baru</nz-tag>
                </div>
                <div class="notif-msg" *ngIf="n.message">{{ n.message }}</div>
                <div class="notif-time">{{ timeAgo(n.created_at) }}</div>
              </div>
              <div class="notif-actions" (click)="$event.stopPropagation()">
                <button nz-button nzType="text" nzSize="small"
                        *ngIf="!n.is_read"
                        nz-tooltip nzTooltipTitle="Tandai Dibaca"
                        (click)="markRead(n)">
                  <span nz-icon nzType="check" nzTheme="outline"></span>
                </button>
                <button nz-button nzType="text" nzDanger nzSize="small"
                        nz-popconfirm nzPopconfirmTitle="Hapus notifikasi ini?"
                        (nzOnConfirm)="deleteNotification(n)">
                  <span nz-icon nzType="delete" nzTheme="outline"></span>
                </button>
              </div>
            </div>
          </nz-list-item>
        </nz-list>

        <ng-template #emptyTpl>
          <nz-empty *ngIf="!loading()"
                    nzNotFoundContent="Tidak ada notifikasi"
                    style="padding: 60px 0;">
          </nz-empty>
        </ng-template>

        <div class="pagination-wrapper" *ngIf="meta() && meta()!.total_pages > 1">
          <nz-pagination
            [nzPageIndex]="meta()!.page"
            [nzTotal]="meta()!.total"
            [nzPageSize]="meta()!.per_page"
            nzSize="small"
            (nzPageIndexChange)="onPageChange($event)">
          </nz-pagination>
        </div>
      </nz-spin>
    </div>
  `,
  styles: [`
    .notification-page { max-width: 800px; margin: 0 auto; padding: 24px 16px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .page-header h2 { margin: 0; font-size: 20px; font-weight: 600; }
    .filter-bar { margin-bottom: 16px; }
    .notif-row { display: flex; align-items: flex-start; gap: 12px; width: 100%; padding: 12px; border-radius: 8px; cursor: pointer; transition: background .15s; }
    .notif-row:hover { background: #fafafa; }
    .notif-row.unread { background: #e6f4ff; }
    .notif-icon { font-size: 20px; padding-top: 2px; flex-shrink: 0; }
    .notif-body { flex: 1; min-width: 0; }
    .notif-title { font-size: 14px; font-weight: 500; color: #1a1a1a; display: flex; align-items: center; gap: 6px; }
    .notif-msg { font-size: 13px; color: #666; margin-top: 2px; }
    .notif-time { font-size: 12px; color: #999; margin-top: 4px; }
    .notif-actions { display: flex; gap: 4px; flex-shrink: 0; }
    .pagination-wrapper { display: flex; justify-content: flex-end; margin-top: 16px; }
    .text-blue-500 { color: #3b82f6; }
    .text-green-500 { color: #22c55e; }
    .text-orange-500 { color: #f97316; }
    .text-red-500 { color: #ef4444; }
    .text-purple-500 { color: #a855f7; }
    :host ::ng-deep .ant-tag { font-size: 10px; padding: 0 4px; line-height: 18px; }
    :host ::ng-deep .ant-list-item { padding: 0 !important; border-bottom: 1px solid #f5f5f5 !important; }
  `]
})
export class NotificationListPage implements OnInit, OnDestroy {
  readonly notifService = inject(AppNotificationService);
  private readonly router = inject(Router);

  readonly notifications = signal<AppNotification[]>([]);
  readonly meta = signal<PaginationMeta | null>(null);
  readonly loading = signal(false);
  readonly filterIndex = signal(0);

  readonly filterOptions = ['Semua', 'Belum Dibaca', 'Sudah Dibaca'];
  private currentFilter: FilterStatus = 'all';
  private sub?: Subscription;

  readonly filteredNotifications = signal<AppNotification[]>([]);

  ngOnInit(): void {
    this.loadPage(1);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onFilterChange(value: string | number): void {
    const index = typeof value === 'number' ? value : this.filterOptions.indexOf(value);
    this.filterIndex.set(index);
    const map: FilterStatus[] = ['all', 'unread', 'read'];
    this.currentFilter = map[index];
    this.applyFilter();
  }

  private applyFilter(): void {
    const all = this.notifications();
    if (this.currentFilter === 'unread') {
      this.filteredNotifications.set(all.filter(n => !n.is_read));
    } else if (this.currentFilter === 'read') {
      this.filteredNotifications.set(all.filter(n => n.is_read));
    } else {
      this.filteredNotifications.set(all);
    }
  }

  loadPage(page: number): void {
    this.loading.set(true);
    this.sub?.unsubscribe();
    this.sub = this.notifService.loadNotifications(page).subscribe({
      next: res => {
        this.notifications.set(res.data);
        this.meta.set(res.meta);
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onPageChange(page: number): void {
    this.loadPage(page);
  }

  onNotificationClick(n: AppNotification): void {
    if (!n.is_read) {
      this.markRead(n);
    }
    if (n.document_id) {
      this.router.navigate(['/documents', n.document_id]);
    }
  }

  markRead(n: AppNotification): void {
    this.notifService.markRead(n.id).subscribe(() => {
      this.notifService.getUnreadCount();
      this.notifications.update(list =>
        list.map(item => item.id === n.id ? { ...item, is_read: true } : item)
      );
      this.applyFilter();
    });
  }

  markAllRead(): void {
    this.notifService.markAllRead().subscribe(() => {
      this.notifService.getUnreadCount();
      this.notifications.update(list =>
        list.map(n => ({ ...n, is_read: true }))
      );
      this.applyFilter();
    });
  }

  deleteNotification(n: AppNotification): void {
    this.notifService.deleteNotification(n.id).subscribe(() => {
      this.notifService.getUnreadCount();
      this.notifications.update(list => list.filter(item => item.id !== n.id));
      this.applyFilter();
    });
  }

  getIcon(type: string): string {
    const map: Record<string, string> = {
      workflow_assigned: 'file-text',
      document_approved: 'check-circle',
      document_rejected: 'close-circle',
      comment_added: 'message',
      document_shared: 'share-alt',
    };
    return map[type] || 'notification';
  }

  getIconColor(type: string): string {
    const map: Record<string, string> = {
      workflow_assigned: 'text-blue-500',
      document_approved: 'text-green-500',
      document_rejected: 'text-red-500',
      comment_added: 'text-purple-500',
      document_shared: 'text-orange-500',
    };
    return map[type] || 'text-blue-500';
  }

  timeAgo(dateStr: string): string {
    const now = Date.now();
    const diff = now - new Date(dateStr).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return 'Baru saja';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} menit lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} hari lalu`;
    const months = Math.floor(days / 30);
    return `${months} bulan lalu`;
  }
}

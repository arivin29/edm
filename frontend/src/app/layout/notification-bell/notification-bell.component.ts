import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { AppNotificationService, AppNotification } from '../../core/services/app-notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule,
    NzDropDownModule,
    NzIconModule,
    NzBadgeModule,
    NzEmptyModule,
    NzSpinModule,
  ],
  template: `
    <nz-badge [nzCount]="notifService.unreadCount()" nzSize="small">
      <a nz-dropdown [nzDropdownMenu]="notifMenu" nzTrigger="click"
         (nzVisibleChange)="onDropdownVisibleChange($event)"
         class="header-icon">
        <span nz-icon nzType="bell" nzTheme="outline"></span>
      </a>
    </nz-badge>
    <nz-dropdown-menu #notifMenu="nzDropdownMenu">
      <div class="notification-dropdown">
        <div class="notif-header">
          <span>Notifikasi</span>
          <a (click)="markAllRead()" *ngIf="notifService.unreadCount() > 0">Tandai Semua Dibaca</a>
        </div>
        <div class="notif-list">
          <nz-spin *ngIf="loading()" nzSimple style="padding: 24px; text-align: center; display: block;"></nz-spin>
          <ng-container *ngIf="!loading()">
            <nz-empty *ngIf="recentNotifications().length === 0"
                      nzNotFoundContent="Belum ada notifikasi"
                      style="padding: 24px 0;"></nz-empty>
            <div *ngFor="let n of recentNotifications()"
                 class="notif-item" [class.unread]="!n.is_read"
                 (click)="onNotificationClick(n)">
              <span nz-icon [nzType]="getIcon(n.type)" nzTheme="outline"
                    [class]="getIconColor(n.type)"></span>
              <div class="notif-content">
                <p>{{ n.title }}</p>
                <span class="msg" *ngIf="n.message">{{ n.message | slice:0:60 }}{{ (n.message.length || 0) > 60 ? '...' : '' }}</span>
                <span class="time">{{ timeAgo(n.created_at) }}</span>
              </div>
            </div>
          </ng-container>
        </div>
        <div class="notif-footer">
          <a (click)="viewAll()">Lihat Semua</a>
        </div>
      </div>
    </nz-dropdown-menu>
  `,
  styles: [`
    .notification-dropdown { width: 320px; background: #fff; border-radius: 8px; box-shadow: 0 6px 16px rgba(0,0,0,.08); }
    .notif-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #f0f0f0; }
    .notif-header span { font-weight: 500; color: #1a1a1a; }
    .notif-header a { font-size: 12px; color: #1890ff; cursor: pointer; }
    .notif-list { max-height: 320px; overflow-y: auto; }
    .notif-item { display: flex; gap: 10px; padding: 10px 16px; cursor: pointer; transition: background .15s; }
    .notif-item:hover { background: #fafafa; }
    .notif-item.unread { background: #e6f4ff; border-left: 2px solid #1890ff; }
    .notif-content { flex: 1; min-width: 0; }
    .notif-content p { margin: 0; font-size: 13px; color: #333; line-height: 1.4; }
    .notif-content .msg { display: block; font-size: 12px; color: #666; margin-top: 2px; }
    .notif-content .time { display: block; font-size: 11px; color: #999; margin-top: 4px; }
    .notif-footer { padding: 8px 16px; border-top: 1px solid #f0f0f0; text-align: center; }
    .notif-footer a { font-size: 13px; color: #1890ff; cursor: pointer; }
    .header-icon { padding: 8px; border-radius: 8px; color: #6b7280; cursor: pointer; }
    .header-icon:hover { background: #f3f4f6; }
    .text-blue-500 { color: #3b82f6; }
    .text-green-500 { color: #22c55e; }
    .text-orange-500 { color: #f97316; }
    .text-red-500 { color: #ef4444; }
    .text-purple-500 { color: #a855f7; }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  readonly notifService = inject(AppNotificationService);
  private readonly router = inject(Router);

  readonly recentNotifications = signal<AppNotification[]>([]);
  readonly loading = signal(false);
  private sub?: Subscription;

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onDropdownVisibleChange(visible: boolean): void {
    if (visible) {
      this.loadRecent();
    }
  }

  private loadRecent(): void {
    this.loading.set(true);
    this.sub?.unsubscribe();
    this.sub = this.notifService.loadNotifications(1, 5).subscribe({
      next: res => {
        this.recentNotifications.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onNotificationClick(n: AppNotification): void {
    if (!n.is_read) {
      this.notifService.markRead(n.id).subscribe(() => {
        this.notifService.getUnreadCount();
        n.is_read = true;
        this.recentNotifications.update(list => [...list]);
      });
    }
    if (n.document_id) {
      this.router.navigate(['/documents', n.document_id]);
    }
  }

  markAllRead(): void {
    this.notifService.markAllRead().subscribe(() => {
      this.notifService.getUnreadCount();
      this.recentNotifications.update(list =>
        list.map(n => ({ ...n, is_read: true }))
      );
    });
  }

  viewAll(): void {
    this.router.navigate(['/notifications']);
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

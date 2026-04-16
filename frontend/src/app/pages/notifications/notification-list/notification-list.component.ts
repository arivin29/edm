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
} from '../../../core/services/app-notification.service';
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
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.scss'],
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

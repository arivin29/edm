import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message?: string;
  data?: any;
  document_id?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

@Injectable({ providedIn: 'root' })
export class AppNotificationService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/notifications`;
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  readonly unreadCount = signal(0);

  constructor() {
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  private startPolling(): void {
    this.getUnreadCount();
    this.pollTimer = setInterval(() => this.getUnreadCount(), 30_000);
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  loadNotifications(page = 1, perPage = 20) {
    return this.http.get<{ data: AppNotification[]; meta: PaginationMeta }>(
      this.baseUrl, { params: { page: page.toString(), per_page: perPage.toString() } }
    );
  }

  getUnreadCount(): void {
    this.http.get<{ data: { unread_count: number } }>(`${this.baseUrl}/unread-count`)
      .subscribe({
        next: res => this.unreadCount.set(res.data.unread_count),
        error: () => {}
      });
  }

  markRead(id: string) {
    return this.http.post<{ message: string }>(`${this.baseUrl}/${id}/read`, {});
  }

  markAllRead() {
    return this.http.post<{ message: string }>(`${this.baseUrl}/read-all`, {});
  }

  deleteNotification(id: string) {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }
}

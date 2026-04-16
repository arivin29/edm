import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { environment } from '../../../../environments/environment';
import { AuditLog, AuditMeta, UserOption } from './audit-log.models';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzTableModule, NzButtonModule, NzIconModule, NzTagModule,
    NzInputModule, NzCardModule, NzSelectModule, NzSpinModule,
    NzDatePickerModule, NzToolTipModule, NzEmptyModule
  ],
  templateUrl: './audit-log.component.html',
  styleUrls: ['./audit-log.component.scss']
})
export class AuditLogPage implements OnInit {
  private http = inject(HttpClient);

  logs = signal<AuditLog[]>([]);
  loading = signal(false);
  meta = signal<AuditMeta>({ page: 1, per_page: 50, total: 0, total_pages: 0 });
  userOptions = signal<UserOption[]>([]);

  statCreate = signal(0);
  statUpdate = signal(0);
  statDelete = signal(0);
  statLogin = signal(0);

  filterUserId: string | null = null;
  filterAction: string | null = null;
  filterEntityType: string | null = null;
  filterDateRange: Date[] | null = null;

  expandedIds = new Set<string>();

  ngOnInit(): void {
    this.loadUsers();
    this.loadLogs();
    this.loadStats();
  }

  loadUsers(): void {
    this.http.get<any>(`${environment.apiUrl}/users`).subscribe({
      next: (res) => {
        const users = (res.data || []).map((u: any) => ({ id: u.id, name: u.name }));
        this.userOptions.set(users);
      }
    });
  }

  loadStats(): void {
    ['create', 'update', 'delete', 'login'].forEach(action => {
      this.http.get<any>(`${environment.apiUrl}/audit-logs`, {
        params: { action, per_page: '1' }
      }).subscribe({
        next: (res) => {
          const count = res.meta?.total || 0;
          if (action === 'create') this.statCreate.set(count);
          else if (action === 'update') this.statUpdate.set(count);
          else if (action === 'delete') this.statDelete.set(count);
          else if (action === 'login') this.statLogin.set(count);
        }
      });
    });
  }

  loadLogs(): void {
    this.loading.set(true);
    const m = this.meta();
    let params = new HttpParams()
      .set('page', m.page.toString())
      .set('per_page', m.per_page.toString())
      .set('sort_by', 'created_at')
      .set('sort_dir', 'desc');

    if (this.filterUserId) params = params.set('user_id', this.filterUserId);
    if (this.filterAction) params = params.set('action', this.filterAction);
    if (this.filterEntityType) params = params.set('entity_type', this.filterEntityType);
    if (this.filterDateRange && this.filterDateRange.length === 2) {
      params = params.set('date_from', this.toISODate(this.filterDateRange[0]));
      params = params.set('date_to', this.toISODate(this.filterDateRange[1]));
    }

    this.http.get<{ data: AuditLog[]; meta: AuditMeta }>(`${environment.apiUrl}/audit-logs`, { params }).subscribe({
      next: (res) => {
        this.logs.set(res.data || []);
        if (res.meta) this.meta.set(res.meta);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onFilter(): void {
    this.meta.update(m => ({ ...m, page: 1 }));
    this.expandedIds.clear();
    this.loadLogs();
  }

  onReset(): void {
    this.filterUserId = null;
    this.filterAction = null;
    this.filterEntityType = null;
    this.filterDateRange = null;
    this.meta.update(m => ({ ...m, page: 1, per_page: 50 }));
    this.expandedIds.clear();
    this.loadLogs();
  }

  onPageChange(page: number): void {
    this.meta.update(m => ({ ...m, page }));
    this.expandedIds.clear();
    this.loadLogs();
  }

  onPageSizeChange(perPage: number): void {
    this.meta.update(m => ({ ...m, page: 1, per_page: perPage }));
    this.expandedIds.clear();
    this.loadLogs();
  }

  toggleExpand(id: string): void {
    if (this.expandedIds.has(id)) {
      this.expandedIds.delete(id);
    } else {
      this.expandedIds.add(id);
    }
  }

  getInitial(log: AuditLog): string {
    const name = log.user?.name || log.user_name || '?';
    return name.charAt(0).toUpperCase();
  }

  getActionColor(action: string): string {
    const colors: Record<string, string> = {
      create: 'green', update: 'blue', delete: 'red', login: 'cyan', logout: 'orange'
    };
    return colors[action?.toLowerCase()] || 'default';
  }

  getActionIcon(action: string): string {
    const icons: Record<string, string> = {
      create: 'plus-circle', update: 'edit', delete: 'delete', login: 'login', logout: 'logout'
    };
    return icons[action?.toLowerCase()] || 'info-circle';
  }

  getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      create: 'Buat', update: 'Ubah', delete: 'Hapus', login: 'Login', logout: 'Logout'
    };
    return labels[action?.toLowerCase()] || action;
  }

  getDefaultDescription(log: AuditLog): string {
    const entity = log.entity_type || '';
    const name = log.entity_name ? ` "${log.entity_name}"` : '';
    const actionMap: Record<string, string> = {
      create: `Membuat ${entity}${name}`,
      update: `Mengubah ${entity}${name}`,
      delete: `Menghapus ${entity}${name}`,
      login: 'Masuk ke sistem',
      logout: 'Keluar dari sistem'
    };
    return actionMap[log.action?.toLowerCase()] || `${log.action} ${entity}${name}`;
  }

  formatDateTime(iso: string): string {
    if (!iso) return '-';
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}`;
  }

  formatJson(val: any): string {
    if (!val) return '-';
    try {
      return typeof val === 'string' ? JSON.stringify(JSON.parse(val), null, 2) : JSON.stringify(val, null, 2);
    } catch {
      return String(val);
    }
  }

  private toISODate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

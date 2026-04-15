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
import { environment } from '../../../environments/environment';

interface AuditLog {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  user_position?: string;
  office_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  entity_name?: string;
  description?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user?: { id: string; name: string; email: string };
}

interface AuditMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

interface UserOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzTableModule, NzButtonModule, NzIconModule, NzTagModule,
    NzInputModule, NzCardModule, NzSelectModule, NzSpinModule,
    NzDatePickerModule, NzToolTipModule, NzEmptyModule
  ],
  styles: [`
    :host ::ng-deep .ant-table-small .ant-table-thead > tr > th { padding: 8px; font-size: 11px; font-weight: 600; background: #fafafa; }
    :host ::ng-deep .ant-table-small .ant-table-tbody > tr > td { padding: 6px 8px; font-size: 12px; }
    :host ::ng-deep .ant-table-small .ant-table-tbody > tr:nth-child(even):not(.expand-row) { background: #fafbfc; }
    :host ::ng-deep .ant-card-body { padding: 12px; }
    :host ::ng-deep .ant-tag { font-size: 10px; padding: 0 4px; line-height: 18px; }
    .json-preview { background: #f5f5f5; padding: 8px 12px; border-radius: 4px; font-size: 11px; max-height: 300px; overflow: auto; margin: 4px 0; font-family: monospace; }
    .expand-row td { background: #f9f9f9 !important; }
  `],
  template: `
    <div class="p-4">
      <!-- Header -->
      <div class="flex justify-between items-center mb-4">
        <div>
          <h1 class="text-lg font-semibold m-0">Audit Log</h1>
          <p class="text-gray-500 text-xs m-0">Riwayat aktivitas pengguna dalam sistem</p>
        </div>
        <button nz-button nzSize="small" (click)="onReset()">
          <span nz-icon nzType="reload"></span> Reset Filter
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-5 gap-3 mb-4">
        <div class="bg-white rounded-lg border p-3 border-l-4 border-l-blue-500">
          <div class="text-xs text-gray-500">Total Log</div>
          <div class="text-xl font-bold text-gray-800">{{ meta().total }}</div>
        </div>
        <div class="bg-white rounded-lg border p-3 border-l-4 border-l-green-500">
          <div class="text-xs text-gray-500">Create</div>
          <div class="text-xl font-bold text-green-600">{{ statCreate() }}</div>
        </div>
        <div class="bg-white rounded-lg border p-3 border-l-4 border-l-blue-400">
          <div class="text-xs text-gray-500">Update</div>
          <div class="text-xl font-bold text-blue-500">{{ statUpdate() }}</div>
        </div>
        <div class="bg-white rounded-lg border p-3 border-l-4 border-l-red-500">
          <div class="text-xs text-gray-500">Delete</div>
          <div class="text-xl font-bold text-red-500">{{ statDelete() }}</div>
        </div>
        <div class="bg-white rounded-lg border p-3 border-l-4 border-l-cyan-500">
          <div class="text-xs text-gray-500">Login</div>
          <div class="text-xl font-bold text-cyan-600">{{ statLogin() }}</div>
        </div>
      </div>

      <!-- Filters -->
      <nz-card nzSize="small" class="mb-3">
        <div class="flex items-center gap-3 flex-wrap">
          <nz-select nzSize="small" [(ngModel)]="filterUserId" nzPlaceHolder="Semua Pengguna" nzAllowClear
                     nzShowSearch class="w-44">
            @for (u of userOptions(); track u.id) {
              <nz-option [nzValue]="u.id" [nzLabel]="u.name"></nz-option>
            }
          </nz-select>

          <nz-select nzSize="small" [(ngModel)]="filterAction" nzPlaceHolder="Semua Aksi" nzAllowClear class="w-32">
            <nz-option nzValue="create" nzLabel="Create"></nz-option>
            <nz-option nzValue="update" nzLabel="Update"></nz-option>
            <nz-option nzValue="delete" nzLabel="Delete"></nz-option>
            <nz-option nzValue="login" nzLabel="Login"></nz-option>
            <nz-option nzValue="logout" nzLabel="Logout"></nz-option>
          </nz-select>

          <nz-select nzSize="small" [(ngModel)]="filterEntityType" nzPlaceHolder="Semua Entitas" nzAllowClear class="w-36">
            <nz-option nzValue="document" nzLabel="Document"></nz-option>
            <nz-option nzValue="user" nzLabel="User"></nz-option>
            <nz-option nzValue="company" nzLabel="Company"></nz-option>
            <nz-option nzValue="workflow" nzLabel="Workflow"></nz-option>
            <nz-option nzValue="template" nzLabel="Template"></nz-option>
            <nz-option nzValue="role" nzLabel="Role"></nz-option>
            <nz-option nzValue="department" nzLabel="Department"></nz-option>
            <nz-option nzValue="category" nzLabel="Category"></nz-option>
          </nz-select>

          <nz-range-picker nzSize="small" [(ngModel)]="filterDateRange" nzFormat="dd/MM/yyyy" class="w-56"></nz-range-picker>

          <button nz-button nzType="primary" nzSize="small" (click)="onFilter()">
            <span nz-icon nzType="search"></span> Cari
          </button>
        </div>
      </nz-card>

      <!-- Table -->
      <nz-card nzSize="small">
        <nz-table #logTable
                  [nzData]="logs()"
                  [nzLoading]="loading()"
                  nzSize="small"
                  [nzFrontPagination]="false"
                  [nzTotal]="meta().total"
                  [nzPageSize]="meta().per_page"
                  [nzPageIndex]="meta().page"
                  [nzShowSizeChanger]="true"
                  [nzPageSizeOptions]="[25, 50, 100]"
                  (nzPageIndexChange)="onPageChange($event)"
                  (nzPageSizeChange)="onPageSizeChange($event)">
          <thead>
            <tr>
              <th nzWidth="28px"></th>
              <th nzWidth="130px">Waktu</th>
              <th nzWidth="140px">Pengguna</th>
              <th nzWidth="80px" nzAlign="center">Aksi</th>
              <th nzWidth="100px">Entitas</th>
              <th>Deskripsi</th>
              <th nzWidth="110px">IP Address</th>
            </tr>
          </thead>
          <tbody>
            @for (log of logTable.data; track log.id) {
              <tr>
                <td>
                  @if (log.old_values || log.new_values) {
                    <span nz-icon [nzType]="expandedIds.has(log.id) ? 'minus-square' : 'plus-square'"
                          class="cursor-pointer text-blue-500"
                          (click)="toggleExpand(log.id)"></span>
                  }
                </td>
                <td class="text-xs text-gray-600">{{ formatDateTime(log.created_at) }}</td>
                <td>
                  <div class="flex items-center gap-1.5">
                    <span class="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      {{ getInitial(log) }}
                    </span>
                    <div class="min-w-0">
                      <div class="text-xs font-medium truncate max-w-[110px]" [nz-tooltip]="log.user?.name || log.user_name || '-'">
                        {{ log.user?.name || log.user_name || '-' }}
                      </div>
                    </div>
                  </div>
                </td>
                <td nzAlign="center">
                  <nz-tag [nzColor]="getActionColor(log.action)">
                    <span nz-icon [nzType]="getActionIcon(log.action)" class="mr-0.5"></span>
                    {{ getActionLabel(log.action) }}
                  </nz-tag>
                </td>
                <td>
                  <div class="text-xs">
                    <nz-tag>{{ log.entity_type || '-' }}</nz-tag>
                    @if (log.entity_name) {
                      <div class="text-[10px] text-gray-400 mt-0.5 truncate max-w-[90px]" [nz-tooltip]="log.entity_name">{{ log.entity_name }}</div>
                    }
                  </div>
                </td>
                <td class="text-xs text-gray-600">{{ log.description || getDefaultDescription(log) }}</td>
                <td class="font-mono text-[11px] text-gray-400">{{ log.ip_address || '-' }}</td>
              </tr>
              @if (expandedIds.has(log.id)) {
                <tr class="expand-row">
                  <td colspan="7">
                    <div class="flex gap-4 p-1">
                      @if (log.old_values) {
                        <div class="flex-1">
                          <div class="text-xs font-semibold text-red-500 mb-1">
                            <span nz-icon nzType="minus-circle" class="mr-1"></span>Nilai Lama
                          </div>
                          <pre class="json-preview">{{ formatJson(log.old_values) }}</pre>
                        </div>
                      }
                      @if (log.new_values) {
                        <div class="flex-1">
                          <div class="text-xs font-semibold text-green-600 mb-1">
                            <span nz-icon nzType="plus-circle" class="mr-1"></span>Nilai Baru
                          </div>
                          <pre class="json-preview">{{ formatJson(log.new_values) }}</pre>
                        </div>
                      }
                    </div>
                    @if (log.user_agent) {
                      <div class="text-[10px] text-gray-400 mt-1 px-1 truncate" [nz-tooltip]="log.user_agent">
                        <span nz-icon nzType="desktop" class="mr-1"></span>{{ log.user_agent }}
                      </div>
                    }
                  </td>
                </tr>
              }
            } @empty {
              <tr>
                <td colspan="7" class="text-center py-8">
                  <span nz-icon nzType="inbox" class="text-3xl text-gray-300 mb-2 block"></span>
                  <span class="text-gray-400">Tidak ada data audit log</span>
                </td>
              </tr>
            }
          </tbody>
        </nz-table>
      </nz-card>
    </div>
  `
})
export class AuditLogPage implements OnInit {
  private http = inject(HttpClient);

  logs = signal<AuditLog[]>([]);
  loading = signal(false);
  meta = signal<AuditMeta>({ page: 1, per_page: 50, total: 0, total_pages: 0 });
  userOptions = signal<UserOption[]>([]);

  // Stats
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

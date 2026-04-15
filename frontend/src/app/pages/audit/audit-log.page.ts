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
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { environment } from '../../../environments/environment';

interface AuditLog {
  id: string;
  user_id: string;
  office_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
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
    NzDatePickerModule, NzFormModule, NzEmptyModule
  ],
  styles: [`
    :host ::ng-deep .ant-table-small .ant-table-thead > tr > th { padding: 6px 8px; font-size: 11px; }
    :host ::ng-deep .ant-table-small .ant-table-tbody > tr > td { padding: 4px 8px; font-size: 12px; }
    :host ::ng-deep .ant-card-body { padding: 12px; }
    :host ::ng-deep .ant-form-item { margin-bottom: 8px; }
    :host ::ng-deep .ant-tag { font-size: 10px; padding: 0 4px; line-height: 18px; }
    .json-preview { background: #f5f5f5; padding: 8px 12px; border-radius: 4px; font-size: 11px; max-height: 300px; overflow: auto; margin: 4px 0; }
    .expand-row td { background: #fafafa; }
  `],
  template: `
    <div class="p-4">
      <!-- Header -->
      <div class="flex justify-between items-center mb-4">
        <div>
          <h1 class="text-lg font-semibold m-0">Audit Log</h1>
          <p class="text-gray-500 text-xs m-0">Riwayat aktivitas pengguna dalam sistem</p>
        </div>
      </div>

      <!-- Filters -->
      <nz-card nzSize="small" class="mb-3">
        <div class="flex flex-wrap gap-2 items-end">
          <nz-form-item>
            <nz-form-label class="text-xs">Pengguna</nz-form-label>
            <nz-form-control>
              <nz-select nzSize="small" [(ngModel)]="filterUserId" nzPlaceHolder="Semua" nzAllowClear
                         nzShowSearch style="width: 180px">
                @for (u of userOptions(); track u.id) {
                  <nz-option [nzValue]="u.id" [nzLabel]="u.name"></nz-option>
                }
              </nz-select>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label class="text-xs">Aksi</nz-form-label>
            <nz-form-control>
              <nz-select nzSize="small" [(ngModel)]="filterAction" nzPlaceHolder="Semua" nzAllowClear
                         style="width: 130px">
                <nz-option nzValue="create" nzLabel="Create"></nz-option>
                <nz-option nzValue="update" nzLabel="Update"></nz-option>
                <nz-option nzValue="delete" nzLabel="Delete"></nz-option>
                <nz-option nzValue="login" nzLabel="Login"></nz-option>
                <nz-option nzValue="logout" nzLabel="Logout"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label class="text-xs">Tipe Entitas</nz-form-label>
            <nz-form-control>
              <nz-select nzSize="small" [(ngModel)]="filterEntityType" nzPlaceHolder="Semua" nzAllowClear
                         style="width: 140px">
                <nz-option nzValue="document" nzLabel="Document"></nz-option>
                <nz-option nzValue="user" nzLabel="User"></nz-option>
                <nz-option nzValue="company" nzLabel="Company"></nz-option>
                <nz-option nzValue="workflow" nzLabel="Workflow"></nz-option>
                <nz-option nzValue="template" nzLabel="Template"></nz-option>
                <nz-option nzValue="role" nzLabel="Role"></nz-option>
                <nz-option nzValue="department" nzLabel="Department"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-label class="text-xs">Rentang Tanggal</nz-form-label>
            <nz-form-control>
              <nz-range-picker nzSize="small" [(ngModel)]="filterDateRange" nzFormat="dd/MM/yyyy"></nz-range-picker>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-control>
              <button nz-button nzType="primary" nzSize="small" (click)="onFilter()">
                <span nz-icon nzType="search"></span> Cari
              </button>
            </nz-form-control>
          </nz-form-item>

          <nz-form-item>
            <nz-form-control>
              <button nz-button nzSize="small" (click)="onReset()">
                <span nz-icon nzType="reload"></span> Reset
              </button>
            </nz-form-control>
          </nz-form-item>
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
              <th nzWidth="30px"></th>
              <th nzWidth="150px">Waktu</th>
              <th nzWidth="160px">Pengguna</th>
              <th nzWidth="90px">Aksi</th>
              <th nzWidth="110px">Tipe Entitas</th>
              <th nzWidth="120px">ID Entitas</th>
              <th nzWidth="120px">IP Address</th>
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
                <td>{{ formatDate(log.created_at) }}</td>
                <td>{{ log.user?.name || log.user_id || '-' }}</td>
                <td>
                  <nz-tag [nzColor]="getActionColor(log.action)">{{ log.action | uppercase }}</nz-tag>
                </td>
                <td>{{ log.entity_type || '-' }}</td>
                <td class="font-mono text-xs">{{ log.entity_id || '-' }}</td>
                <td class="font-mono text-xs">{{ log.ip_address || '-' }}</td>
              </tr>
              @if (expandedIds.has(log.id)) {
                <tr class="expand-row">
                  <td colspan="7">
                    <div class="flex gap-4">
                      @if (log.old_values) {
                        <div class="flex-1">
                          <strong class="text-xs">Nilai Lama:</strong>
                          <pre class="json-preview">{{ formatJson(log.old_values) }}</pre>
                        </div>
                      }
                      @if (log.new_values) {
                        <div class="flex-1">
                          <strong class="text-xs">Nilai Baru:</strong>
                          <pre class="json-preview">{{ formatJson(log.new_values) }}</pre>
                        </div>
                      }
                    </div>
                  </td>
                </tr>
              }
            } @empty {
              <tr>
                <td colspan="7" class="text-center py-8">
                  <nz-empty nzNotFoundContent="Tidak ada data audit log"></nz-empty>
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

  filterUserId: string | null = null;
  filterAction: string | null = null;
  filterEntityType: string | null = null;
  filterDateRange: Date[] | null = null;

  expandedIds = new Set<string>();

  ngOnInit(): void {
    this.loadUsers();
    this.loadLogs();
  }

  loadUsers(): void {
    this.http.get<any>(`${environment.apiUrl}/users`).subscribe({
      next: (res) => {
        const users = (res.data || []).map((u: any) => ({ id: u.id, name: u.name }));
        this.userOptions.set(users);
      }
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

  getActionColor(action: string): string {
    const colors: Record<string, string> = {
      create: 'green', update: 'blue', delete: 'red', login: 'cyan', logout: 'orange'
    };
    return colors[action?.toLowerCase()] || 'default';
  }

  formatDate(iso: string): string {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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

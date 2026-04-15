import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { environment } from '../../../environments/environment';

interface SystemSetting {
  id: string;
  company_id?: string;
  office_id?: string;
  key: string;
  value: string;
  type: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface DropdownItem {
  id: string;
  name: string;
}

interface CategoryGroup {
  prefix: string;
  label: string;
  items: SystemSetting[];
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzTableModule, NzButtonModule, NzIconModule, NzCardModule,
    NzInputModule, NzDrawerModule, NzModalModule, NzFormModule, NzTagModule,
    NzSpinModule, NzSwitchModule, NzSelectModule, NzInputNumberModule,
    NzToolTipModule, NzCollapseModule
  ],
  template: `
    <div class="p-3">
      <div class="flex justify-between items-center mb-3">
        <div>
          <h1 class="text-base font-semibold m-0">System Settings</h1>
          <p class="text-gray-500 text-xs m-0">Kelola pengaturan sistem aplikasi</p>
        </div>
        <button nz-button nzType="primary" nzSize="small" (click)="openDrawer()">
          <span nz-icon nzType="plus"></span> Tambah
        </button>
      </div>

      <nz-spin [nzSpinning]="loading()">
        <nz-card nzSize="small">
          <div class="mb-2">
            <nz-input-group nzSize="small" [nzPrefix]="searchIcon" class="w-64">
              <input nz-input placeholder="Cari key atau deskripsi..." [(ngModel)]="searchTerm" />
            </nz-input-group>
            <ng-template #searchIcon><span nz-icon nzType="search"></span></ng-template>
          </div>

          @if (filteredGroups().length === 0 && !loading()) {
            <div class="text-center text-gray-400 py-8 text-xs">Tidak ada pengaturan ditemukan</div>
          }

          <nz-collapse [nzBordered]="false" class="settings-collapse">
            @for (group of filteredGroups(); track group.prefix) {
              <nz-collapse-panel [nzHeader]="group.label + ' (' + group.items.length + ')'" [nzActive]="true">
                <nz-table #settingTable [nzData]="group.items" nzSize="small"
                          [nzShowPagination]="group.items.length > 10" [nzPageSize]="10"
                          [nzFrontPagination]="true">
                  <thead>
                    <tr>
                      <th nzWidth="200px">Key</th>
                      <th nzWidth="200px">Value</th>
                      <th nzWidth="80px">Tipe</th>
                      <th>Deskripsi</th>
                      <th nzWidth="120px">Company</th>
                      <th nzWidth="80px" nzAlign="center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of settingTable.data; track item.id) {
                      <tr>
                        <td><code class="text-xs">{{ item.key }}</code></td>
                        <td>
                          <span class="truncate-value" [nz-tooltip]="item.value">
                            {{ truncateValue(item.value) }}
                          </span>
                        </td>
                        <td>
                          <nz-tag [nzColor]="typeColor(item.type)" class="text-xs">{{ item.type }}</nz-tag>
                        </td>
                        <td class="text-gray-500 text-xs">{{ item.description || '-' }}</td>
                        <td class="text-xs">{{ getCompanyName(item.company_id) }}</td>
                        <td nzAlign="center">
                          <button nz-button nzType="text" nzSize="small" (click)="openDrawer(item)">
                            <span nz-icon nzType="edit" class="text-blue-500"></span>
                          </button>
                          <button nz-button nzType="text" nzSize="small" (click)="confirmDelete(item)">
                            <span nz-icon nzType="delete" class="text-red-500"></span>
                          </button>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="6" class="text-center text-gray-400 py-4 text-xs">Tidak ada data</td>
                      </tr>
                    }
                  </tbody>
                </nz-table>
              </nz-collapse-panel>
            }
          </nz-collapse>
        </nz-card>
      </nz-spin>

      <!-- Drawer -->
      <nz-drawer [nzVisible]="drawerVisible" [nzTitle]="editId ? 'Edit Setting' : 'Tambah Setting'"
                 nzPlacement="right" [nzWidth]="420" (nzOnClose)="closeDrawer()">
        <ng-container *nzDrawerContent>
          <form nz-form nzLayout="vertical">
            <nz-form-item>
              <nz-form-label nzRequired>Key</nz-form-label>
              <nz-form-control>
                <input nz-input nzSize="small" [(ngModel)]="formData.key" name="key"
                       placeholder="contoh: app.name, email.smtp_host" />
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label nzRequired>Tipe</nz-form-label>
              <nz-form-control>
                <nz-select nzSize="small" [(ngModel)]="formData.type" name="type"
                           (ngModelChange)="onTypeChange($event)">
                  <nz-option nzValue="string" nzLabel="String"></nz-option>
                  <nz-option nzValue="number" nzLabel="Number"></nz-option>
                  <nz-option nzValue="boolean" nzLabel="Boolean"></nz-option>
                  <nz-option nzValue="json" nzLabel="JSON"></nz-option>
                </nz-select>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label nzRequired>Value</nz-form-label>
              <nz-form-control>
                @switch (formData.type) {
                  @case ('boolean') {
                    <nz-switch [(ngModel)]="formBoolValue" name="boolValue"></nz-switch>
                  }
                  @case ('number') {
                    <nz-input-number nzSize="small" [(ngModel)]="formNumValue" name="numValue"
                                     [nzStep]="1" style="width: 100%"></nz-input-number>
                  }
                  @case ('json') {
                    <textarea nz-input [(ngModel)]="formData.value" name="value"
                              [nzAutosize]="{ minRows: 4, maxRows: 10 }"
                              placeholder='{"key": "value"}'></textarea>
                  }
                  @default {
                    <input nz-input nzSize="small" [(ngModel)]="formData.value" name="value"
                           placeholder="Masukkan nilai..." />
                  }
                }
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label>Deskripsi</nz-form-label>
              <nz-form-control>
                <textarea nz-input [(ngModel)]="formData.description" name="description"
                          [nzAutosize]="{ minRows: 2, maxRows: 4 }"
                          placeholder="Deskripsi pengaturan (opsional)"></textarea>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label>Company</nz-form-label>
              <nz-form-control>
                <nz-select nzSize="small" [(ngModel)]="formData.company_id" name="company_id"
                           nzPlaceHolder="Pilih company (opsional)" nzAllowClear>
                  @for (c of companies(); track c.id) {
                    <nz-option [nzValue]="c.id" [nzLabel]="c.name"></nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label>Office</nz-form-label>
              <nz-form-control>
                <nz-select nzSize="small" [(ngModel)]="formData.office_id" name="office_id"
                           nzPlaceHolder="Pilih office (opsional)" nzAllowClear>
                  @for (o of offices(); track o.id) {
                    <nz-option [nzValue]="o.id" [nzLabel]="o.name"></nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>

            <div class="mt-4">
              <button nz-button nzType="primary" nzSize="small" nzBlock [nzLoading]="saving()" (click)="save()">
                Simpan
              </button>
            </div>
          </form>
        </ng-container>
      </nz-drawer>
    </div>
  `,
  styles: [`
    :host ::ng-deep .ant-table-small .ant-table-thead > tr > th { padding: 6px 8px; font-size: 11px; }
    :host ::ng-deep .ant-table-small .ant-table-tbody > tr > td { padding: 4px 8px; font-size: 12px; }
    :host ::ng-deep .ant-card-body { padding: 12px; }
    :host ::ng-deep .ant-form-item { margin-bottom: 12px; }
    :host ::ng-deep .ant-tag { font-size: 10px; padding: 0 4px; line-height: 18px; }
    :host ::ng-deep .ant-collapse-content > .ant-collapse-content-box { padding: 0; }
    :host ::ng-deep .ant-collapse > .ant-collapse-item > .ant-collapse-header { padding: 6px 12px; font-size: 12px; font-weight: 600; }
    :host ::ng-deep .settings-collapse .ant-collapse-item { margin-bottom: 8px; }
    code { background: #f5f5f5; padding: 1px 4px; border-radius: 2px; }
    .truncate-value { display: inline-block; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }
  `]
})
export class SettingsPage implements OnInit {
  private http = inject(HttpClient);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);

  private readonly apiUrl = environment.apiUrl;

  searchTerm = '';

  settings = signal<SystemSetting[]>([]);
  companies = signal<DropdownItem[]>([]);
  offices = signal<DropdownItem[]>([]);
  loading = signal(false);
  saving = signal(false);

  filteredSettings = computed(() => {
    const term = this.searchTerm.toLowerCase();
    if (!term) return this.settings();
    return this.settings().filter(s =>
      s.key.toLowerCase().includes(term) ||
      (s.description || '').toLowerCase().includes(term) ||
      s.value.toLowerCase().includes(term)
    );
  });

  filteredGroups = computed((): CategoryGroup[] => {
    const items = this.filteredSettings();
    const groupMap = new Map<string, SystemSetting[]>();

    for (const item of items) {
      const dotIndex = item.key.indexOf('.');
      const prefix = dotIndex > 0 ? item.key.substring(0, dotIndex) : 'general';
      if (!groupMap.has(prefix)) groupMap.set(prefix, []);
      groupMap.get(prefix)!.push(item);
    }

    return Array.from(groupMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([prefix, groupItems]) => ({
        prefix,
        label: prefix.charAt(0).toUpperCase() + prefix.slice(1),
        items: groupItems.sort((a, b) => a.key.localeCompare(b.key))
      }));
  });

  // Drawer state
  drawerVisible = false;
  editId: string | null = null;
  formData: any = { key: '', value: '', type: 'string', description: '', company_id: null, office_id: null };
  formBoolValue = false;
  formNumValue: number = 0;

  ngOnInit() {
    this.loadSettings();
    this.loadDropdowns();
  }

  loadSettings() {
    this.loading.set(true);
    this.http.get<{ data: SystemSetting[] }>(`${this.apiUrl}/settings`).subscribe({
      next: (res) => {
        this.settings.set(res.data || []);
        this.loading.set(false);
      },
      error: () => {
        this.settings.set([]);
        this.loading.set(false);
      }
    });
  }

  loadDropdowns() {
    forkJoin({
      companies: this.http.get<{ data: DropdownItem[] }>(`${this.apiUrl}/companies`),
      offices: this.http.get<{ data: DropdownItem[] }>(`${this.apiUrl}/offices`)
    }).subscribe({
      next: (res) => {
        this.companies.set(res.companies.data || []);
        this.offices.set(res.offices.data || []);
      },
      error: () => {
        this.companies.set([]);
        this.offices.set([]);
      }
    });
  }

  openDrawer(item?: SystemSetting) {
    this.editId = item?.id || null;
    if (item) {
      this.formData = {
        key: item.key,
        value: item.value,
        type: item.type,
        description: item.description || '',
        company_id: item.company_id || null,
        office_id: item.office_id || null
      };
      if (item.type === 'boolean') this.formBoolValue = item.value === 'true';
      if (item.type === 'number') this.formNumValue = Number(item.value) || 0;
    } else {
      this.formData = { key: '', value: '', type: 'string', description: '', company_id: null, office_id: null };
      this.formBoolValue = false;
      this.formNumValue = 0;
    }
    this.drawerVisible = true;
  }

  closeDrawer() {
    this.drawerVisible = false;
    this.editId = null;
  }

  onTypeChange(type: string) {
    switch (type) {
      case 'boolean':
        this.formBoolValue = false;
        this.formData.value = 'false';
        break;
      case 'number':
        this.formNumValue = 0;
        this.formData.value = '0';
        break;
      case 'json':
        this.formData.value = '{}';
        break;
      default:
        this.formData.value = '';
    }
  }

  save() {
    if (!this.formData.key?.trim()) {
      this.message.warning('Key wajib diisi');
      return;
    }

    // Resolve value from type-specific inputs
    if (this.formData.type === 'boolean') {
      this.formData.value = String(this.formBoolValue);
    } else if (this.formData.type === 'number') {
      this.formData.value = String(this.formNumValue ?? 0);
    }

    if (this.formData.type === 'json') {
      try {
        JSON.parse(this.formData.value);
      } catch {
        this.message.warning('Format JSON tidak valid');
        return;
      }
    }

    const body: any = {
      key: this.formData.key.trim(),
      value: this.formData.value,
      type: this.formData.type,
      description: this.formData.description || undefined,
      company_id: this.formData.company_id || undefined,
      office_id: this.formData.office_id || undefined
    };

    this.saving.set(true);
    this.http.put<{ data: SystemSetting }>(`${this.apiUrl}/settings`, body).subscribe({
      next: () => {
        this.message.success('Pengaturan berhasil disimpan');
        this.closeDrawer();
        this.loadSettings();
        this.saving.set(false);
      },
      error: (err) => {
        this.message.error(err?.error?.message || 'Gagal menyimpan pengaturan');
        this.saving.set(false);
      }
    });
  }

  confirmDelete(item: SystemSetting) {
    this.modal.confirm({
      nzTitle: 'Hapus Pengaturan?',
      nzContent: `Yakin ingin menghapus pengaturan "${item.key}"?`,
      nzOkText: 'Hapus',
      nzOkDanger: true,
      nzCancelText: 'Batal',
      nzOnOk: () => this.delete(item.id)
    });
  }

  private delete(id: string) {
    this.http.delete(`${this.apiUrl}/settings/${id}`).subscribe({
      next: () => {
        this.message.success('Pengaturan berhasil dihapus');
        this.loadSettings();
      },
      error: (err) => {
        this.message.error(err?.error?.message || 'Gagal menghapus pengaturan');
      }
    });
  }

  truncateValue(value: string): string {
    return value && value.length > 40 ? value.substring(0, 40) + '...' : value || '-';
  }

  typeColor(type: string): string {
    const colors: Record<string, string> = { string: 'blue', number: 'green', boolean: 'orange', json: 'purple' };
    return colors[type] || 'default';
  }

  getCompanyName(companyId?: string): string {
    if (!companyId) return '-';
    return this.companies().find(c => c.id === companyId)?.name || companyId;
  }
}

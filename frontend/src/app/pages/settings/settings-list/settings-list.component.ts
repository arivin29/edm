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
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { environment } from '../../../../environments/environment';
import { SystemSetting, DropdownItem, CategoryGroup } from '../settings.models';
import { SettingsFormComponent } from '../settings-form/settings-form.component';

interface WatermarkConfigItem {
  enabled: boolean;
  text: string;
  color: string;
  opacity: number;
  font_size: number;
  rotation: number;
  position: string;
}

@Component({
  selector: 'app-settings-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzTableModule, NzButtonModule, NzIconModule, NzCardModule,
    NzInputModule, NzDrawerModule, NzModalModule, NzTagModule,
    NzSpinModule, NzToolTipModule, NzCollapseModule, NzSwitchModule, NzSelectModule,
    SettingsFormComponent
  ],
  templateUrl: './settings-list.component.html',
  styleUrls: ['./settings-list.component.scss']
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
  editItem: SystemSetting | null = null;

  // Watermark config
  watermarkConfig = signal<Record<string, WatermarkConfigItem>>({});
  watermarkLoading = signal(false);
  classificationLabels: Record<string, string> = {
    public: '🌐 Publik',
    internal: '👥 Internal',
    confidential: '🔒 Rahasia',
    secret: '🛡️ Sangat Rahasia'
  };
  classificationColors: Record<string, string> = {
    public: '#22c55e',
    internal: '#3b82f6',
    confidential: '#f97316',
    secret: '#ef4444'
  };

  // TTE config
  tteProvider = 'internal';
  tteEnabled = false;

  ngOnInit() {
    this.loadSettings();
    this.loadDropdowns();
    this.loadWatermarkConfig();
    this.loadTTEConfig();
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
    this.editItem = item || null;
    this.drawerVisible = true;
  }

  closeDrawer() {
    this.drawerVisible = false;
    this.editItem = null;
  }

  onFormSave(event: { data: any; isEdit: boolean }) {
    const { data } = event;

    if (!data.key?.trim()) {
      this.message.warning('Key wajib diisi');
      return;
    }

    if (data.type === 'json') {
      try {
        JSON.parse(data.value);
      } catch {
        this.message.warning('Format JSON tidak valid');
        return;
      }
    }

    const body: any = {
      key: data.key.trim(),
      value: data.value,
      type: data.type,
      description: data.description || undefined,
      company_id: data.company_id || undefined,
      office_id: data.office_id || undefined
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

  // Watermark methods
  loadWatermarkConfig() {
    this.watermarkLoading.set(true);
    this.http.get<any>(`${this.apiUrl}/watermark/config`).subscribe({
      next: (res) => {
        this.watermarkConfig.set(res.data || {});
        this.watermarkLoading.set(false);
      },
      error: () => this.watermarkLoading.set(false)
    });
  }

  updateWatermark(classification: string, field: string, value: any) {
    const payload: any = { classification };
    payload[field] = value;

    this.http.put<any>(`${this.apiUrl}/watermark/config`, payload).subscribe({
      next: (res) => {
        this.watermarkConfig.update(cfg => ({
          ...cfg,
          [classification]: res.data
        }));
        this.message.success(`Watermark ${classification} diperbarui`);
      },
      error: () => this.message.error('Gagal memperbarui watermark')
    });
  }

  getClassifications(): string[] {
    return ['public', 'internal', 'confidential', 'secret'];
  }

  loadTTEConfig() {
    this.http.get<any>(`${environment.apiUrl}/tte/config`).subscribe({
      next: (res) => {
        this.tteProvider = res.data?.provider || 'internal';
        this.tteEnabled = res.data?.enabled || false;
      },
      error: () => {}
    });
  }

  updateTTESetting(key: string, value: string) {
    this.http.put<any>(`${environment.apiUrl}/settings`, { key, value }).subscribe({
      next: () => this.message.success('Pengaturan TTE diperbarui'),
      error: () => this.message.error('Gagal memperbarui pengaturan TTE')
    });
  }
}

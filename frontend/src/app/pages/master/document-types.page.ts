import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { environment } from '../../../environments/environment';

interface DocumentType {
  id: string;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  template_count?: number;
}

@Component({
  selector: 'app-document-types',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzTableModule, NzButtonModule, NzIconModule, NzCardModule,
    NzInputModule, NzDrawerModule, NzModalModule, NzFormModule, NzTagModule,
    NzSpinModule, NzSwitchModule, NzSelectModule, NzToolTipModule
  ],
  template: `
    <div class="p-3">
      <div class="flex justify-between items-center mb-3">
        <div>
          <h1 class="text-base font-semibold m-0">Tipe Dokumen</h1>
          <p class="text-gray-500 text-xs m-0">Kelola tipe dokumen</p>
        </div>
        <button nz-button nzType="primary" nzSize="small" (click)="openDrawer()">
          <span nz-icon nzType="plus"></span> Tambah
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-3 gap-3 mb-4">
        <div class="bg-white rounded-lg border p-3">
          <div class="text-xs text-gray-500">Total</div>
          <div class="text-xl font-bold text-gray-800">{{ statsTotal() }}</div>
        </div>
        <div class="bg-white rounded-lg border p-3 border-l-2 border-l-green-500">
          <div class="text-xs text-gray-500">Aktif</div>
          <div class="text-xl font-bold text-green-600">{{ statsActive() }}</div>
        </div>
        <div class="bg-white rounded-lg border p-3 border-l-2 border-l-red-400">
          <div class="text-xs text-gray-500">Nonaktif</div>
          <div class="text-xl font-bold text-red-500">{{ statsInactive() }}</div>
        </div>
      </div>

      <nz-spin [nzSpinning]="loading()">
        <nz-card nzSize="small">
          <div class="mb-2">
            <nz-input-group nzSize="small" [nzPrefix]="searchIcon" class="w-48">
              <input nz-input placeholder="Cari tipe..." [(ngModel)]="searchText" />
            </nz-input-group>
          </div>
          <nz-table #tbl [nzData]="filteredItems()" nzSize="small"
                    [nzPageSize]="10" [nzShowSizeChanger]="false">
            <thead>
              <tr>
                <th nzWidth="40px" nzAlign="center">Ikon</th>
                <th nzWidth="100px">Kode</th>
                <th>Nama</th>
                <th>Deskripsi</th>
                <th nzWidth="70px" nzAlign="center">Template</th>
                <th nzWidth="60px" nzAlign="center">Urutan</th>
                <th nzWidth="80px" nzAlign="center">Status</th>
                <th nzWidth="90px">Dibuat</th>
                <th nzWidth="80px" nzAlign="center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              @for (item of tbl.data; track item.id) {
                <tr>
                  <td nzAlign="center">
                    <span nz-icon [nzType]="item.icon || 'file-text'" class="text-blue-500 text-base"></span>
                  </td>
                  <td><code class="text-xs">{{ item.code }}</code></td>
                  <td class="font-medium">{{ item.name }}</td>
                  <td class="text-gray-500 text-xs">{{ item.description || '-' }}</td>
                  <td nzAlign="center">
                    <nz-tag class="m-0">{{ item.template_count || 0 }}</nz-tag>
                  </td>
                  <td nzAlign="center">{{ item.sort_order }}</td>
                  <td nzAlign="center">
                    <nz-tag [nzColor]="item.is_active ? 'green' : 'default'" class="text-xs m-0">
                      {{ item.is_active ? 'Aktif' : 'Nonaktif' }}
                    </nz-tag>
                  </td>
                  <td>
                    <span class="text-xs text-gray-500">{{ formatDate(item.created_at) }}</span>
                  </td>
                  <td nzAlign="center">
                    <button nz-button nzType="text" nzSize="small" (click)="openDrawer(item)"
                            nz-tooltip nzTooltipTitle="Edit">
                      <span nz-icon nzType="edit" class="text-blue-500"></span>
                    </button>
                    <button nz-button nzType="text" nzSize="small" (click)="confirmDelete(item)"
                            nz-tooltip nzTooltipTitle="Hapus">
                      <span nz-icon nzType="delete" class="text-red-500"></span>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="9" class="text-center text-gray-400 py-4">Tidak ada data</td></tr>
              }
            </tbody>
          </nz-table>
        </nz-card>
      </nz-spin>

      <ng-template #searchIcon><span nz-icon nzType="search"></span></ng-template>

      <!-- Drawer Form -->
      <nz-drawer [nzVisible]="drawerVisible" [nzTitle]="drawerTitle" nzPlacement="right"
                 nzWidth="380px" (nzOnClose)="closeDrawer()">
        <ng-container *nzDrawerContent>
          <form nz-form nzLayout="vertical">
            <nz-form-item>
              <nz-form-label nzRequired>Kode</nz-form-label>
              <nz-form-control nzErrorTip="Kode wajib diisi">
                <input nz-input nzSize="small" [(ngModel)]="formData.code" name="code"
                       placeholder="Masukkan kode" [maxlength]="50" />
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label nzRequired>Nama</nz-form-label>
              <nz-form-control nzErrorTip="Nama wajib diisi">
                <input nz-input nzSize="small" [(ngModel)]="formData.name" name="name"
                       placeholder="Masukkan nama" [maxlength]="255" />
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label>Deskripsi</nz-form-label>
              <nz-form-control>
                <textarea nz-input nzSize="small" [(ngModel)]="formData.description" name="description"
                          placeholder="Deskripsi (opsional)" [nzAutosize]="{ minRows: 2, maxRows: 4 }"></textarea>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label>Ikon</nz-form-label>
              <nz-form-control>
                <nz-select nzSize="small" [(ngModel)]="formData.icon" name="icon"
                           nzPlaceHolder="Pilih ikon" nzAllowClear nzShowSearch>
                  @for (ic of iconOptions; track ic) {
                    <nz-option [nzValue]="ic" [nzLabel]="ic" nzCustomContent>
                      <span nz-icon [nzType]="ic" class="mr-2"></span> {{ ic }}
                    </nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label>Urutan</nz-form-label>
              <nz-form-control>
                <input nz-input nzSize="small" [(ngModel)]="formData.sort_order" name="sort_order"
                       type="number" placeholder="0" min="0" />
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label>Status</nz-form-label>
              <nz-form-control>
                <nz-switch [(ngModel)]="formData.is_active" [ngModelOptions]="{standalone: true}"
                           nzCheckedChildren="Aktif" nzUnCheckedChildren="Nonaktif"></nz-switch>
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
    :host ::ng-deep .ant-table-small .ant-table-thead > tr > th { padding: 6px 8px; font-size: 11px; font-weight: 600; background: #fafafa; }
    :host ::ng-deep .ant-table-small .ant-table-tbody > tr > td { padding: 4px 8px; font-size: 12px; }
    :host ::ng-deep .ant-table-small .ant-table-tbody > tr:nth-child(even) > td { background: #fafbfc; }
    :host ::ng-deep .ant-card-body { padding: 12px; }
    :host ::ng-deep .ant-form-item { margin-bottom: 12px; }
    :host ::ng-deep .ant-tag { font-size: 10px; padding: 0 4px; line-height: 18px; }
    code { background: #f0f2f5; padding: 1px 5px; border-radius: 3px; font-size: 11px; color: #595959; }
  `]
})
export class DocumentTypesPage implements OnInit {
  private http = inject(HttpClient);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);
  private readonly apiUrl = environment.apiUrl;

  searchText = '';
  items = signal<DocumentType[]>([]);
  loading = signal(false);
  saving = signal(false);

  statsTotal = computed(() => this.items().length);
  statsActive = computed(() => this.items().filter(i => i.is_active).length);
  statsInactive = computed(() => this.items().filter(i => !i.is_active).length);

  filteredItems = computed(() => {
    const term = this.searchText.toLowerCase();
    if (!term) return this.items();
    return this.items().filter(t =>
      t.code.toLowerCase().includes(term) || t.name.toLowerCase().includes(term)
    );
  });

  iconOptions = [
    'file-text', 'file-word', 'file-pdf', 'file-excel', 'file',
    'folder', 'folder-open', 'solution', 'audit', 'safety-certificate',
    'profile', 'idcard', 'contacts', 'bank', 'insurance',
    'dollar', 'money-collect', 'read', 'book', 'snippets',
    'container', 'database', 'form', 'table', 'ordered-list',
    'apartment', 'shop', 'team', 'user', 'calendar',
    'mail', 'notification', 'setting', 'tool', 'build'
  ];

  drawerVisible = false;
  drawerTitle = '';
  formData: any = {};
  editId: string | null = null;

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}/document-types`).subscribe({
      next: (res) => { this.items.set(res.data || []); this.loading.set(false); },
      error: () => { this.items.set([]); this.loading.set(false); }
    });
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }

  openDrawer(item?: DocumentType) {
    this.editId = item?.id || null;
    this.drawerTitle = item ? 'Edit Tipe Dokumen' : 'Tambah Tipe Dokumen';
    this.formData = item
      ? { ...item }
      : { code: '', name: '', description: '', icon: 'file-text', sort_order: 0, is_active: true };
    this.drawerVisible = true;
  }

  closeDrawer() {
    this.drawerVisible = false;
    this.formData = {};
    this.editId = null;
  }

  save() {
    if (!this.formData.code?.trim() || !this.formData.name?.trim()) {
      this.message.warning('Kode dan Nama wajib diisi');
      return;
    }
    this.saving.set(true);
    const url = `${this.apiUrl}/document-types`;
    const req$ = this.editId
      ? this.http.put(`${url}/${this.editId}`, this.formData)
      : this.http.post(url, this.formData);

    req$.subscribe({
      next: () => {
        this.message.success('Data berhasil disimpan');
        this.closeDrawer();
        this.load();
        this.saving.set(false);
      },
      error: (err) => {
        this.message.error(err?.error?.message || 'Gagal menyimpan data');
        this.saving.set(false);
      }
    });
  }

  confirmDelete(item: DocumentType) {
    this.modal.confirm({
      nzTitle: 'Hapus Tipe Dokumen?',
      nzContent: `Yakin ingin menghapus "${item.name}"?`,
      nzOkText: 'Hapus',
      nzOkDanger: true,
      nzCancelText: 'Batal',
      nzOnOk: () => {
        this.http.delete(`${this.apiUrl}/document-types/${item.id}`).subscribe({
          next: () => { this.message.success('Data berhasil dihapus'); this.load(); },
          error: (err) => { this.message.error(err?.error?.message || 'Gagal menghapus'); }
        });
      }
    });
  }
}

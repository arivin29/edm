import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
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
import { environment } from '../../../environments/environment';

interface DocumentType {
  id: string;
  code: string;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
}

interface DocumentCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  parent_id?: string;
  sort_order: number;
  is_active: boolean;
}

type MasterType = 'document-type' | 'category';

@Component({
  selector: 'app-master-data',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzTabsModule, NzTableModule, NzButtonModule, NzIconModule, NzCardModule,
    NzInputModule, NzDrawerModule, NzModalModule, NzFormModule, NzTagModule,
    NzSpinModule, NzSwitchModule
  ],
  template: `
    <div class="p-3">
      <div class="mb-3">
        <h1 class="text-base font-semibold m-0">Master Data</h1>
        <p class="text-gray-500 text-xs m-0">Kelola tipe dokumen dan kategori</p>
      </div>

      <nz-spin [nzSpinning]="loading()">
        <nz-card nzSize="small">
          <nz-tabset nzSize="small" [(nzSelectedIndex)]="activeTab">
            <!-- Document Types Tab -->
            <nz-tab nzTitle="Tipe Dokumen">
              <div class="flex justify-between items-center mb-2">
                <nz-input-group nzSize="small" [nzPrefix]="searchIcon" class="w-48">
                  <input nz-input placeholder="Cari tipe..." [(ngModel)]="search.type" />
                </nz-input-group>
                <button nz-button nzType="primary" nzSize="small" (click)="openDrawer('document-type')">
                  <span nz-icon nzType="plus"></span> Tambah
                </button>
              </div>
              <nz-table #typeTable [nzData]="filteredTypes()" nzSize="small"
                        [nzPageSize]="10" [nzShowSizeChanger]="false">
                <thead>
                  <tr>
                    <th nzWidth="100px">Kode</th>
                    <th>Nama</th>
                    <th>Deskripsi</th>
                    <th nzWidth="60px">Urutan</th>
                    <th nzWidth="80px">Status</th>
                    <th nzWidth="80px" nzAlign="center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of typeTable.data; track item.id) {
                    <tr>
                      <td><code class="text-xs">{{ item.code }}</code></td>
                      <td>{{ item.name }}</td>
                      <td class="text-gray-500 text-xs">{{ item.description || '-' }}</td>
                      <td>{{ item.sort_order }}</td>
                      <td>
                        <nz-tag [nzColor]="item.is_active ? 'green' : 'default'" class="text-xs">
                          {{ item.is_active ? 'Aktif' : 'Nonaktif' }}
                        </nz-tag>
                      </td>
                      <td nzAlign="center">
                        <button nz-button nzType="text" nzSize="small" (click)="openDrawer('document-type', item)">
                          <span nz-icon nzType="edit" class="text-blue-500"></span>
                        </button>
                        <button nz-button nzType="text" nzSize="small" (click)="confirmDelete('document-type', item)">
                          <span nz-icon nzType="delete" class="text-red-500"></span>
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="6" class="text-center text-gray-400 py-4">Tidak ada data</td></tr>
                  }
                </tbody>
              </nz-table>
            </nz-tab>

            <!-- Categories Tab -->
            <nz-tab nzTitle="Kategori">
              <div class="flex justify-between items-center mb-2">
                <nz-input-group nzSize="small" [nzPrefix]="searchIcon" class="w-48">
                  <input nz-input placeholder="Cari kategori..." [(ngModel)]="search.category" />
                </nz-input-group>
                <button nz-button nzType="primary" nzSize="small" (click)="openDrawer('category')">
                  <span nz-icon nzType="plus"></span> Tambah
                </button>
              </div>
              <nz-table #catTable [nzData]="filteredCategories()" nzSize="small"
                        [nzPageSize]="10" [nzShowSizeChanger]="false">
                <thead>
                  <tr>
                    <th nzWidth="100px">Kode</th>
                    <th>Nama</th>
                    <th>Deskripsi</th>
                    <th nzWidth="60px">Urutan</th>
                    <th nzWidth="80px">Status</th>
                    <th nzWidth="80px" nzAlign="center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of catTable.data; track item.id) {
                    <tr>
                      <td><code class="text-xs">{{ item.code }}</code></td>
                      <td>{{ item.name }}</td>
                      <td class="text-gray-500 text-xs">{{ item.description || '-' }}</td>
                      <td>{{ item.sort_order }}</td>
                      <td>
                        <nz-tag [nzColor]="item.is_active ? 'green' : 'default'" class="text-xs">
                          {{ item.is_active ? 'Aktif' : 'Nonaktif' }}
                        </nz-tag>
                      </td>
                      <td nzAlign="center">
                        <button nz-button nzType="text" nzSize="small" (click)="openDrawer('category', item)">
                          <span nz-icon nzType="edit" class="text-blue-500"></span>
                        </button>
                        <button nz-button nzType="text" nzSize="small" (click)="confirmDelete('category', item)">
                          <span nz-icon nzType="delete" class="text-red-500"></span>
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="6" class="text-center text-gray-400 py-4">Tidak ada data</td></tr>
                  }
                </tbody>
              </nz-table>
            </nz-tab>
          </nz-tabset>
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
    :host ::ng-deep .ant-tabs-tab { font-size: 12px; padding: 6px 12px; }
    :host ::ng-deep .ant-table-small .ant-table-thead > tr > th { padding: 6px 8px; font-size: 11px; }
    :host ::ng-deep .ant-table-small .ant-table-tbody > tr > td { padding: 4px 8px; font-size: 12px; }
    :host ::ng-deep .ant-card-body { padding: 12px; }
    :host ::ng-deep .ant-form-item { margin-bottom: 12px; }
    :host ::ng-deep .ant-tag { font-size: 10px; padding: 0 4px; line-height: 18px; }
    code { background: #f5f5f5; padding: 1px 4px; border-radius: 2px; }
  `]
})
export class MasterDataPage implements OnInit {
  private http = inject(HttpClient);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);

  private readonly apiUrl = environment.apiUrl;

  activeTab = 0;
  search = { type: '', category: '' };

  documentTypes = signal<DocumentType[]>([]);
  categories = signal<DocumentCategory[]>([]);
  loading = signal(false);
  saving = signal(false);

  filteredTypes = computed(() => {
    const term = this.search.type.toLowerCase();
    return this.documentTypes().filter(t =>
      t.code.toLowerCase().includes(term) || t.name.toLowerCase().includes(term)
    );
  });

  filteredCategories = computed(() => {
    const term = this.search.category.toLowerCase();
    return this.categories().filter(c =>
      c.code.toLowerCase().includes(term) || c.name.toLowerCase().includes(term)
    );
  });

  // Drawer state
  drawerVisible = false;
  drawerType: MasterType = 'document-type';
  drawerTitle = '';
  formData: any = {};
  editId: string | null = null;

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.loading.set(true);
    let completed = 0;
    const done = () => { if (++completed >= 2) this.loading.set(false); };

    this.http.get<any>(`${this.apiUrl}/document-types`).subscribe({
      next: (res) => { this.documentTypes.set(res.data || []); done(); },
      error: () => { this.documentTypes.set([]); done(); }
    });
    this.http.get<any>(`${this.apiUrl}/categories`).subscribe({
      next: (res) => { this.categories.set(res.data || []); done(); },
      error: () => { this.categories.set([]); done(); }
    });
  }

  openDrawer(type: MasterType, item?: any) {
    this.drawerType = type;
    this.editId = item?.id || null;
    const label = type === 'document-type' ? 'Tipe Dokumen' : 'Kategori';
    this.drawerTitle = item ? `Edit ${label}` : `Tambah ${label}`;

    if (item) {
      this.formData = { ...item };
    } else {
      this.formData = { code: '', name: '', description: '', sort_order: 0, is_active: true };
    }
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
    const endpoint = `${this.apiUrl}/${this.getEndpoint(this.drawerType)}`;
    const request$ = this.editId
      ? this.http.put(`${endpoint}/${this.editId}`, this.formData)
      : this.http.post(endpoint, this.formData);

    request$.subscribe({
      next: () => {
        this.message.success('Data berhasil disimpan');
        this.closeDrawer();
        this.loadAll();
        this.saving.set(false);
      },
      error: (err) => {
        this.message.error(err?.error?.message || 'Gagal menyimpan data');
        this.saving.set(false);
      }
    });
  }

  confirmDelete(type: MasterType, item: any) {
    const label = type === 'document-type' ? 'Tipe Dokumen' : 'Kategori';
    this.modal.confirm({
      nzTitle: `Hapus ${label}?`,
      nzContent: `Yakin ingin menghapus "${item.name}"?`,
      nzOkText: 'Hapus',
      nzOkDanger: true,
      nzCancelText: 'Batal',
      nzOnOk: () => this.delete(type, item.id)
    });
  }

  private delete(type: MasterType, id: string) {
    const endpoint = `${this.apiUrl}/${this.getEndpoint(type)}/${id}`;
    this.http.delete(endpoint).subscribe({
      next: () => {
        this.message.success('Data berhasil dihapus');
        this.loadAll();
      },
      error: (err) => {
        this.message.error(err?.error?.message || 'Gagal menghapus data');
      }
    });
  }

  private getEndpoint(type: MasterType): string {
    return type === 'document-type' ? 'document-types' : 'categories';
  }
}

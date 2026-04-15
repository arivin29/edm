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
import { environment } from '../../../environments/environment';

interface DocumentCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  parent_id?: string;
  parent?: { id: string; name: string };
  sort_order: number;
  is_active: boolean;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzTableModule, NzButtonModule, NzIconModule, NzCardModule,
    NzInputModule, NzDrawerModule, NzModalModule, NzFormModule, NzTagModule,
    NzSelectModule, NzSpinModule, NzSwitchModule
  ],
  template: `
    <div class="p-3">
      <div class="flex justify-between items-center mb-3">
        <div>
          <h1 class="text-base font-semibold m-0">Kategori Dokumen</h1>
          <p class="text-gray-500 text-xs m-0">Kelola kategori dokumen</p>
        </div>
        <button nz-button nzType="primary" nzSize="small" (click)="openDrawer()">
          <span nz-icon nzType="plus"></span> Tambah
        </button>
      </div>

      <nz-spin [nzSpinning]="loading()">
        <nz-card nzSize="small">
          <div class="mb-2">
            <nz-input-group nzSize="small" [nzPrefix]="searchIcon" class="w-48">
              <input nz-input placeholder="Cari kategori..." [(ngModel)]="searchText" />
            </nz-input-group>
          </div>
          <nz-table #tbl [nzData]="filteredItems()" nzSize="small"
                    [nzPageSize]="10" [nzShowSizeChanger]="false">
            <thead>
              <tr>
                <th nzWidth="100px">Kode</th>
                <th>Nama</th>
                <th>Parent</th>
                <th>Deskripsi</th>
                <th nzWidth="60px">Urutan</th>
                <th nzWidth="80px">Status</th>
                <th nzWidth="80px" nzAlign="center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              @for (item of tbl.data; track item.id) {
                <tr>
                  <td><code class="text-xs">{{ item.code }}</code></td>
                  <td>{{ item.name }}</td>
                  <td class="text-xs">{{ item.parent?.name || '-' }}</td>
                  <td class="text-gray-500 text-xs">{{ item.description || '-' }}</td>
                  <td>{{ item.sort_order }}</td>
                  <td>
                    <nz-tag [nzColor]="item.is_active ? 'green' : 'default'" class="text-xs">
                      {{ item.is_active ? 'Aktif' : 'Nonaktif' }}
                    </nz-tag>
                  </td>
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
                <tr><td colspan="7" class="text-center text-gray-400 py-4">Tidak ada data</td></tr>
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
              <nz-form-label>Parent Kategori</nz-form-label>
              <nz-form-control>
                <nz-select nzSize="small" [(ngModel)]="formData.parent_id" name="parent_id"
                           nzPlaceHolder="Pilih parent (opsional)" nzAllowClear
                           [nzShowSearch]="true">
                  @for (cat of parentOptions(); track cat.id) {
                    <nz-option [nzValue]="cat.id" [nzLabel]="cat.name"></nz-option>
                  }
                </nz-select>
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
    :host ::ng-deep .ant-table-small .ant-table-thead > tr > th { padding: 6px 8px; font-size: 11px; }
    :host ::ng-deep .ant-table-small .ant-table-tbody > tr > td { padding: 4px 8px; font-size: 12px; }
    :host ::ng-deep .ant-card-body { padding: 12px; }
    :host ::ng-deep .ant-form-item { margin-bottom: 12px; }
    :host ::ng-deep .ant-tag { font-size: 10px; padding: 0 4px; line-height: 18px; }
    code { background: #f5f5f5; padding: 1px 4px; border-radius: 2px; }
  `]
})
export class CategoriesPage implements OnInit {
  private http = inject(HttpClient);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);
  private readonly apiUrl = environment.apiUrl;

  searchText = '';
  items = signal<DocumentCategory[]>([]);
  loading = signal(false);
  saving = signal(false);

  filteredItems = computed(() => {
    const term = this.searchText.toLowerCase();
    if (!term) return this.items();
    return this.items().filter(c =>
      c.code.toLowerCase().includes(term) || c.name.toLowerCase().includes(term)
    );
  });

  // Exclude current item from parent options to avoid self-reference
  parentOptions = computed(() => {
    if (!this.editId) return this.items();
    return this.items().filter(c => c.id !== this.editId);
  });

  drawerVisible = false;
  drawerTitle = '';
  formData: any = {};
  editId: string | null = null;

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}/categories`).subscribe({
      next: (res) => { this.items.set(res.data || []); this.loading.set(false); },
      error: () => { this.items.set([]); this.loading.set(false); }
    });
  }

  openDrawer(item?: DocumentCategory) {
    this.editId = item?.id || null;
    this.drawerTitle = item ? 'Edit Kategori' : 'Tambah Kategori';
    this.formData = item
      ? { ...item }
      : { code: '', name: '', description: '', parent_id: null, sort_order: 0, is_active: true };
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
    const url = `${this.apiUrl}/categories`;
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

  confirmDelete(item: DocumentCategory) {
    this.modal.confirm({
      nzTitle: 'Hapus Kategori?',
      nzContent: `Yakin ingin menghapus "${item.name}"?`,
      nzOkText: 'Hapus',
      nzOkDanger: true,
      nzCancelText: 'Batal',
      nzOnOk: () => {
        this.http.delete(`${this.apiUrl}/categories/${item.id}`).subscribe({
          next: () => { this.message.success('Data berhasil dihapus'); this.load(); },
          error: (err) => { this.message.error(err?.error?.message || 'Gagal menghapus'); }
        });
      }
    });
  }
}

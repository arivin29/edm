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

@Component({
  selector: 'app-document-types',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzTableModule, NzButtonModule, NzIconModule, NzCardModule,
    NzInputModule, NzDrawerModule, NzModalModule, NzFormModule, NzTagModule,
    NzSpinModule, NzSwitchModule
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
                <th nzWidth="100px">Kode</th>
                <th>Nama</th>
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
                <tr><td colspan="6" class="text-center text-gray-400 py-4">Tidak ada data</td></tr>
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
export class DocumentTypesPage implements OnInit {
  private http = inject(HttpClient);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);
  private readonly apiUrl = environment.apiUrl;

  searchText = '';
  items = signal<DocumentType[]>([]);
  loading = signal(false);
  saving = signal(false);

  filteredItems = computed(() => {
    const term = this.searchText.toLowerCase();
    if (!term) return this.items();
    return this.items().filter(t =>
      t.code.toLowerCase().includes(term) || t.name.toLowerCase().includes(term)
    );
  });

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

  openDrawer(item?: DocumentType) {
    this.editId = item?.id || null;
    this.drawerTitle = item ? 'Edit Tipe Dokumen' : 'Tambah Tipe Dokumen';
    this.formData = item
      ? { ...item }
      : { code: '', name: '', description: '', sort_order: 0, is_active: true };
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

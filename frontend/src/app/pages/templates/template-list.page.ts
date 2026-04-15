import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzMessageService } from 'ng-zorro-antd/message';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-template-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzTableModule, NzButtonModule, NzIconModule, NzTagModule,
    NzInputModule, NzCardModule, NzDropDownModule,
    NzDrawerModule, NzFormModule, NzSelectModule, NzUploadModule
  ],
  template: `
    <div class="p-4">
      <!-- Header -->
      <div class="flex justify-between items-center mb-4">
        <div>
          <h1 class="text-lg font-semibold m-0">Template Dokumen</h1>
          <p class="text-gray-500 text-xs m-0">Kelola template DOCX</p>
        </div>
        <button nz-button nzType="primary" nzSize="small" (click)="openDrawer()">
          <span nz-icon nzType="plus"></span>
          Tambah Template
        </button>
      </div>

      <!-- Search -->
      <nz-card nzSize="small" class="mb-3">
        <nz-input-group nzSize="small" [nzPrefix]="prefixIcon" class="w-64">
          <input nz-input placeholder="Cari template..." [(ngModel)]="searchText" (ngModelChange)="onSearch()" />
        </nz-input-group>
        <ng-template #prefixIcon><span nz-icon nzType="search"></span></ng-template>
      </nz-card>

      <!-- Table -->
      <nz-card nzSize="small">
        <nz-table #tplTable [nzData]="templates()" [nzLoading]="loading()" 
                  nzSize="small" [nzPageSize]="15">
          <thead>
            <tr>
              <th>Nama Template</th>
              <th nzWidth="120px">Tipe Dokumen</th>
              <th nzWidth="120px">Kategori</th>
              <th nzWidth="80px">Tags</th>
              <th nzWidth="70px">Status</th>
              <th nzWidth="70px">Aksi</th>
            </tr>
          </thead>
          <tbody>
            @for (tpl of tplTable.data; track tpl.id) {
              <tr>
                <td>
                  <div class="flex items-center gap-2">
                    <span nz-icon nzType="file-text" class="text-blue-500"></span>
                    <span>{{ tpl.name }}</span>
                  </div>
                </td>
                <td>{{ tpl.type_name || '-' }}</td>
                <td>{{ tpl.category_name || '-' }}</td>
                <td>
                  <nz-tag>{{ tpl.tag_count || 0 }} tags</nz-tag>
                </td>
                <td>
                  <nz-tag [nzColor]="tpl.is_active ? 'success' : 'default'">
                    {{ tpl.is_active ? 'Aktif' : 'Nonaktif' }}
                  </nz-tag>
                </td>
                <td>
                  <a nz-dropdown [nzDropdownMenu]="actionMenu" nzTrigger="click">
                    <span nz-icon nzType="more" class="cursor-pointer"></span>
                  </a>
                  <nz-dropdown-menu #actionMenu="nzDropdownMenu">
                    <ul nz-menu nzSelectable>
                      <li nz-menu-item (click)="openDrawer(tpl)">
                        <span nz-icon nzType="edit"></span> Edit
                      </li>
                      <li nz-menu-item (click)="viewTags(tpl)">
                        <span nz-icon nzType="setting"></span> Kelola Tags
                      </li>
                      <li nz-menu-item (click)="download(tpl)">
                        <span nz-icon nzType="download"></span> Download
                      </li>
                      <li nz-menu-item nzDanger (click)="deleteTemplate(tpl)">
                        <span nz-icon nzType="delete"></span> Hapus
                      </li>
                    </ul>
                  </nz-dropdown-menu>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="text-center text-gray-500 py-8">
                  Tidak ada template ditemukan
                </td>
              </tr>
            }
          </tbody>
        </nz-table>
      </nz-card>

      <!-- Drawer Form -->
      <nz-drawer [nzVisible]="drawerVisible" [nzTitle]="editId ? 'Edit Template' : 'Tambah Template'"
                nzPlacement="right" nzWidth="420px" (nzOnClose)="closeDrawer()">
        <ng-container *nzDrawerContent>
          <form nz-form nzLayout="vertical">
            <nz-form-item>
              <nz-form-label nzRequired>Nama Template</nz-form-label>
              <nz-form-control>
                <input nz-input [(ngModel)]="formData.name" name="name" placeholder="Nama template" />
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label>Tipe Dokumen</nz-form-label>
              <nz-form-control>
                <nz-select [(ngModel)]="formData.type_id" name="type_id" nzPlaceHolder="Pilih tipe" nzAllowClear>
                  @for (type of documentTypes(); track type.id) {
                    <nz-option [nzValue]="type.id" [nzLabel]="type.name"></nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label>Kategori</nz-form-label>
              <nz-form-control>
                <nz-select [(ngModel)]="formData.category_id" name="category_id" nzPlaceHolder="Pilih kategori" nzAllowClear>
                  @for (cat of categories(); track cat.id) {
                    <nz-option [nzValue]="cat.id" [nzLabel]="cat.name"></nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>
            <nz-form-item>
              <nz-form-label>Deskripsi</nz-form-label>
              <nz-form-control>
                <textarea nz-input [(ngModel)]="formData.description" name="description" 
                          placeholder="Deskripsi (opsional)" [nzAutosize]="{ minRows: 2, maxRows: 4 }"></textarea>
              </nz-form-control>
            </nz-form-item>
            @if (!editId) {
              <nz-form-item>
                <nz-form-label nzRequired>File Template (DOCX)</nz-form-label>
                <nz-form-control>
                  <nz-upload [nzBeforeUpload]="beforeUpload" [nzFileList]="fileList" nzAccept=".docx">
                    <button nz-button type="button">
                      <span nz-icon nzType="upload"></span> Pilih File
                    </button>
                  </nz-upload>
                </nz-form-control>
              </nz-form-item>
            }
            <div class="mt-4">
              <button nz-button nzType="primary" nzSize="small" nzBlock [nzLoading]="saving()" (click)="save()">Simpan</button>
            </div>
          </form>
        </ng-container>
      </nz-drawer>
    </div>
  `,
  styles: [`
    :host ::ng-deep .ant-table-small .ant-table-thead > tr > th { padding: 8px; font-size: 12px; }
    :host ::ng-deep .ant-table-small .ant-table-tbody > tr > td { padding: 6px 8px; font-size: 12px; }
    :host ::ng-deep .ant-tag { font-size: 11px; }
    :host ::ng-deep .ant-card-body { padding: 12px; }
    :host ::ng-deep .ant-form-item { margin-bottom: 12px; }
  `]
})
export class TemplateListPage implements OnInit {
  private http = inject(HttpClient);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);

  templates = signal<any[]>([]);
  documentTypes = signal<{id: number; name: string}[]>([]);
  categories = signal<{id: number; name: string}[]>([]);
  loading = signal(false);
  saving = signal(false);
  searchText = '';

  drawerVisible = false;
  formData: any = {};
  editId: number | null = null;
  fileList: any[] = [];

  ngOnInit() {
    this.loadTemplates();
    this.loadDropdowns();
  }

  loadTemplates() {
    this.loading.set(true);
    const params: any = {};
    if (this.searchText) params.search = this.searchText;

    this.http.get<any>(`${environment.apiUrl}/templates`, { params }).subscribe({
      next: (res) => {
        this.templates.set(res.data || []);
        this.loading.set(false);
      },
      error: () => {
        this.templates.set([]);
        this.loading.set(false);
      }
    });
  }

  loadDropdowns() {
    this.http.get<any>(`${environment.apiUrl}/document-types`).subscribe({
      next: (res) => this.documentTypes.set(res.data || [])
    });
    this.http.get<any>(`${environment.apiUrl}/document-categories`).subscribe({
      next: (res) => this.categories.set(res.data || [])
    });
  }

  onSearch() {
    this.loadTemplates();
  }

  openDrawer(item?: any) {
    this.editId = item?.id || null;
    this.formData = item ? { ...item } : { name: '', description: '' };
    this.fileList = [];
    this.drawerVisible = true;
  }

  closeDrawer() {
    this.drawerVisible = false;
    this.editId = null;
    this.formData = { name: '', description: '' };
    this.fileList = [];
  }

  beforeUpload = (file: any): boolean => {
    this.fileList = [file];
    return false;
  };

  save() {
    if (!this.formData.name) {
      this.message.warning('Nama template wajib diisi');
      return;
    }
    if (!this.editId && this.fileList.length === 0) {
      this.message.warning('File template wajib diupload');
      return;
    }

    this.saving.set(true);
    const formData = new FormData();
    formData.append('name', this.formData.name);
    if (this.formData.description) formData.append('description', this.formData.description);
    if (this.formData.type_id) formData.append('type_id', this.formData.type_id);
    if (this.formData.category_id) formData.append('category_id', this.formData.category_id);
    if (this.fileList.length > 0) formData.append('file', this.fileList[0]);

    const req = this.editId
      ? this.http.put(`${environment.apiUrl}/templates/${this.editId}`, formData)
      : this.http.post(`${environment.apiUrl}/templates`, formData);

    req.subscribe({
      next: () => {
        this.message.success('Template berhasil disimpan');
        this.drawerVisible = false;
        this.loadTemplates();
        this.saving.set(false);
      },
      error: () => {
        this.message.error('Gagal menyimpan template');
        this.saving.set(false);
      }
    });
  }

  viewTags(tpl: any) {
    this.message.info('Fitur kelola tags sedang dikembangkan');
  }

  download(tpl: any) {
    window.open(`${environment.apiUrl}/templates/${tpl.id}/download`, '_blank');
  }

  deleteTemplate(tpl: any) {
    this.modal.confirm({
      nzTitle: 'Hapus Template?',
      nzContent: `Yakin ingin menghapus template "${tpl.name}"?`,
      nzOkText: 'Hapus',
      nzOkDanger: true,
      nzOnOk: () => {
        this.http.delete(`${environment.apiUrl}/templates/${tpl.id}`).subscribe({
          next: () => {
            this.message.success('Template berhasil dihapus');
            this.loadTemplates();
          },
          error: () => this.message.error('Gagal menghapus template')
        });
      }
    });
  }
}

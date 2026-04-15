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
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { environment } from '../../../environments/environment';

interface DocumentNumbering {
  id: string;
  company_id: string;
  office_id?: string;
  document_type_id: string;
  category_id?: string;
  department_id?: string;
  prefix?: string;
  separator: string;
  format: string;
  current_sequence: number;
  reset_period?: string;
  last_reset_at?: string;
  created_at: string;
  updated_at: string;
}

interface Company { id: string; name: string; }
interface DocumentType { id: string; name: string; code: string; }
interface Category { id: string; name: string; code: string; }
interface Department { id: string; name: string; }
interface Office { id: string; name: string; }

@Component({
  selector: 'app-numbering-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzTableModule, NzButtonModule, NzIconModule, NzCardModule,
    NzInputModule, NzDrawerModule, NzModalModule, NzFormModule,
    NzTagModule, NzSpinModule, NzSelectModule, NzAlertModule, NzToolTipModule
  ],
  template: `
    <div class="p-3">
      <div class="mb-3">
        <h1 class="text-base font-semibold m-0">Penomoran Dokumen</h1>
        <p class="text-gray-500 text-xs m-0">Konfigurasi format dan urutan nomor dokumen</p>
      </div>

      <nz-spin [nzSpinning]="loading()">
        <nz-card nzSize="small">
          <div class="flex justify-between items-center mb-2">
            <nz-input-group nzSize="small" [nzPrefix]="searchIcon" class="w-56">
              <input nz-input placeholder="Cari penomoran..." [(ngModel)]="searchTerm" />
            </nz-input-group>
            <button nz-button nzType="primary" nzSize="small" (click)="openDrawer()">
              <span nz-icon nzType="plus"></span> Tambah
            </button>
          </div>

          <nz-table #tbl [nzData]="filteredData()" nzSize="small"
                    [nzPageSize]="10" [nzShowSizeChanger]="false">
            <thead>
              <tr>
                <th>Perusahaan</th>
                <th>Tipe Dokumen</th>
                <th>Kategori</th>
                <th>Format</th>
                <th>Prefix</th>
                <th nzWidth="60px">Sep.</th>
                <th nzWidth="80px">Seq. Saat Ini</th>
                <th nzWidth="100px">Reset Period</th>
                <th nzWidth="80px" nzAlign="center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              @for (item of tbl.data; track item.id) {
                <tr>
                  <td>{{ getCompanyName(item.company_id) }}</td>
                  <td>{{ getDocTypeName(item.document_type_id) }}</td>
                  <td>{{ item.category_id ? getCategoryName(item.category_id) : '-' }}</td>
                  <td><code class="text-xs">{{ item.format }}</code></td>
                  <td>{{ item.prefix || '-' }}</td>
                  <td><code class="text-xs">{{ item.separator }}</code></td>
                  <td>{{ item.current_sequence }}</td>
                  <td>
                    <nz-tag [nzColor]="getResetColor(item.reset_period)">
                      {{ getResetLabel(item.reset_period) }}
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
                <tr><td colspan="9" class="text-center text-gray-400 py-4">Tidak ada data</td></tr>
              }
            </tbody>
          </nz-table>
        </nz-card>
      </nz-spin>

      <ng-template #searchIcon><span nz-icon nzType="search"></span></ng-template>

      <!-- Drawer Form -->
      <nz-drawer [nzVisible]="drawerVisible" [nzTitle]="drawerTitle" nzPlacement="right"
                 nzWidth="500px" (nzOnClose)="closeDrawer()">
        <ng-container *nzDrawerContent>
          <form nz-form nzLayout="vertical">
            <nz-form-item>
              <nz-form-label nzRequired>Perusahaan</nz-form-label>
              <nz-form-control nzErrorTip="Perusahaan wajib dipilih">
                <nz-select nzSize="small" [(ngModel)]="formData.company_id" name="company_id"
                           nzPlaceHolder="Pilih perusahaan" nzShowSearch>
                  @for (c of companies(); track c.id) {
                    <nz-option [nzValue]="c.id" [nzLabel]="c.name"></nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label>Kantor</nz-form-label>
              <nz-form-control>
                <nz-select nzSize="small" [(ngModel)]="formData.office_id" name="office_id"
                           nzPlaceHolder="Pilih kantor (opsional)" nzShowSearch nzAllowClear>
                  @for (o of offices(); track o.id) {
                    <nz-option [nzValue]="o.id" [nzLabel]="o.name"></nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label nzRequired>Tipe Dokumen</nz-form-label>
              <nz-form-control nzErrorTip="Tipe dokumen wajib dipilih">
                <nz-select nzSize="small" [(ngModel)]="formData.document_type_id" name="document_type_id"
                           nzPlaceHolder="Pilih tipe dokumen" nzShowSearch>
                  @for (dt of documentTypes(); track dt.id) {
                    <nz-option [nzValue]="dt.id" [nzLabel]="dt.name"></nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label>Kategori</nz-form-label>
              <nz-form-control>
                <nz-select nzSize="small" [(ngModel)]="formData.category_id" name="category_id"
                           nzPlaceHolder="Pilih kategori (opsional)" nzShowSearch nzAllowClear>
                  @for (cat of categories(); track cat.id) {
                    <nz-option [nzValue]="cat.id" [nzLabel]="cat.name"></nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label>Departemen</nz-form-label>
              <nz-form-control>
                <nz-select nzSize="small" [(ngModel)]="formData.department_id" name="department_id"
                           nzPlaceHolder="Pilih departemen (opsional)" nzShowSearch nzAllowClear>
                  @for (d of departments(); track d.id) {
                    <nz-option [nzValue]="d.id" [nzLabel]="d.name"></nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label>Prefix</nz-form-label>
              <nz-form-control>
                <input nz-input nzSize="small" [(ngModel)]="formData.prefix" name="prefix"
                       placeholder="Contoh: DOC, INV, PO" />
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label>Separator</nz-form-label>
              <nz-form-control>
                <input nz-input nzSize="small" [(ngModel)]="formData.separator" name="separator"
                       placeholder="/" style="width: 80px;" />
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label>Format Nomor</nz-form-label>
              <nz-form-control>
                <input nz-input nzSize="small" [(ngModel)]="formData.format" name="format"
                       [placeholder]="formatPlaceholder" />
                <div class="format-help">
                  <p class="font-semibold mb-1">Token yang tersedia:</p>
                  <ul>
                    @for (token of formatTokens; track token.key) {
                      <li><code>{{ token.key }}</code> — {{ token.desc }}</li>
                    }
                  </ul>
                </div>
              </nz-form-control>
            </nz-form-item>

            <nz-form-item>
              <nz-form-label>Periode Reset</nz-form-label>
              <nz-form-control>
                <nz-select nzSize="small" [(ngModel)]="formData.reset_period" name="reset_period"
                           nzPlaceHolder="Pilih periode reset">
                  <nz-option nzValue="never" nzLabel="Tidak Reset"></nz-option>
                  <nz-option nzValue="yearly" nzLabel="Tahunan"></nz-option>
                  <nz-option nzValue="monthly" nzLabel="Bulanan"></nz-option>
                </nz-select>
              </nz-form-control>
            </nz-form-item>

            <!-- Preview -->
            <div class="preview-section">
              <div class="flex items-center gap-2 mb-1">
                <button nz-button nzSize="small" (click)="previewNumber()" [nzLoading]="previewing()">
                  <span nz-icon nzType="eye"></span> Preview
                </button>
                @if (previewResult()) {
                  <code class="preview-result">{{ previewResult() }}</code>
                }
              </div>
              <p class="text-gray-400 text-xs m-0">Klik untuk melihat contoh nomor yang akan dihasilkan</p>
            </div>

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
    code { background: #f5f5f5; padding: 1px 4px; border-radius: 2px; font-size: 11px; }
    .format-help {
      margin-top: 6px;
      padding: 8px 10px;
      background: #fafafa;
      border: 1px solid #f0f0f0;
      border-radius: 4px;
      font-size: 11px;
      color: #666;
    }
    .format-help ul { margin: 0; padding-left: 16px; }
    .format-help li { margin-bottom: 2px; }
    .format-help code { background: #e6f4ff; color: #1677ff; }
    .preview-section {
      padding: 10px;
      background: #f6ffed;
      border: 1px solid #b7eb8f;
      border-radius: 4px;
      margin-bottom: 12px;
    }
    .preview-result {
      background: #52c41a;
      color: #fff;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 600;
    }
  `]
})
export class NumberingListPage implements OnInit {
  private http = inject(HttpClient);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);

  private readonly apiUrl = environment.apiUrl;

  searchTerm = '';

  numberings = signal<DocumentNumbering[]>([]);
  companies = signal<Company[]>([]);
  documentTypes = signal<DocumentType[]>([]);
  categories = signal<Category[]>([]);
  departments = signal<Department[]>([]);
  offices = signal<Office[]>([]);

  loading = signal(false);
  saving = signal(false);
  previewing = signal(false);
  previewResult = signal('');

  filteredData = computed(() => {
    const term = this.searchTerm.toLowerCase();
    if (!term) return this.numberings();
    return this.numberings().filter(n => {
      const companyName = this.getCompanyName(n.company_id).toLowerCase();
      const docTypeName = this.getDocTypeName(n.document_type_id).toLowerCase();
      const prefix = (n.prefix || '').toLowerCase();
      const format = (n.format || '').toLowerCase();
      return companyName.includes(term) || docTypeName.includes(term)
        || prefix.includes(term) || format.includes(term);
    });
  });

  formatPlaceholder = '{PREFIX}{SEP}{TYPE}{SEP}{YYYY}{SEP}{SEQ:4}';
  formatTokens = [
    { key: '{PREFIX}', desc: 'Prefix yang ditentukan' },
    { key: '{SEP}', desc: 'Karakter separator' },
    { key: '{TYPE}', desc: 'Kode tipe dokumen' },
    { key: '{CAT}', desc: 'Kode kategori' },
    { key: '{DEPT}', desc: 'Nama departemen' },
    { key: '{YYYY}', desc: 'Tahun 4 digit' },
    { key: '{YY}', desc: 'Tahun 2 digit' },
    { key: '{MM}', desc: 'Bulan 2 digit' },
    { key: '{DD}', desc: 'Tanggal 2 digit' },
    { key: '{SEQ:N}', desc: 'Nomor urut (N = jumlah digit, contoh: SEQ:4 → 0001)' },
  ];

  // Drawer state
  drawerVisible = false;
  drawerTitle = '';
  editId: string | null = null;
  formData: any = {};

  ngOnInit() {
    this.loadDropdowns();
    this.loadData();
  }

  loadDropdowns() {
    forkJoin({
      companies: this.http.get<any>(`${this.apiUrl}/companies`),
      documentTypes: this.http.get<any>(`${this.apiUrl}/document-types`),
      categories: this.http.get<any>(`${this.apiUrl}/categories`),
      departments: this.http.get<any>(`${this.apiUrl}/departments`),
      offices: this.http.get<any>(`${this.apiUrl}/offices`)
    }).subscribe({
      next: (res) => {
        this.companies.set(res.companies.data || []);
        this.documentTypes.set(res.documentTypes.data || []);
        this.categories.set(res.categories.data || []);
        this.departments.set(res.departments.data || []);
        this.offices.set(res.offices.data || []);
      },
      error: () => {
        this.message.error('Gagal memuat data dropdown');
      }
    });
  }

  loadData() {
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}/numbering`).subscribe({
      next: (res) => {
        this.numberings.set(res.data || []);
        this.loading.set(false);
      },
      error: () => {
        this.numberings.set([]);
        this.loading.set(false);
      }
    });
  }

  getCompanyName(id: string): string {
    return this.companies().find(c => c.id === id)?.name || '-';
  }

  getDocTypeName(id: string): string {
    return this.documentTypes().find(dt => dt.id === id)?.name || '-';
  }

  getCategoryName(id: string): string {
    return this.categories().find(c => c.id === id)?.name || '-';
  }

  getResetLabel(period?: string): string {
    switch (period) {
      case 'yearly': return 'Tahunan';
      case 'monthly': return 'Bulanan';
      default: return 'Tidak Reset';
    }
  }

  getResetColor(period?: string): string {
    switch (period) {
      case 'yearly': return 'blue';
      case 'monthly': return 'orange';
      default: return 'default';
    }
  }

  openDrawer(item?: DocumentNumbering) {
    this.editId = item?.id || null;
    this.drawerTitle = item ? 'Edit Penomoran' : 'Tambah Penomoran';
    this.previewResult.set('');

    if (item) {
      this.formData = { ...item };
    } else {
      this.formData = {
        company_id: null,
        office_id: null,
        document_type_id: null,
        category_id: null,
        department_id: null,
        prefix: '',
        separator: '/',
        format: '{PREFIX}{SEP}{TYPE}{SEP}{YYYY}{SEP}{SEQ:4}',
        reset_period: 'never'
      };
    }
    this.drawerVisible = true;
  }

  closeDrawer() {
    this.drawerVisible = false;
    this.formData = {};
    this.editId = null;
    this.previewResult.set('');
  }

  save() {
    if (!this.formData.company_id || !this.formData.document_type_id) {
      this.message.warning('Perusahaan dan Tipe Dokumen wajib dipilih');
      return;
    }
    if (!this.formData.format?.trim()) {
      this.message.warning('Format nomor wajib diisi');
      return;
    }

    this.saving.set(true);
    const request$ = this.editId
      ? this.http.put(`${this.apiUrl}/numbering/${this.editId}`, this.formData)
      : this.http.post(`${this.apiUrl}/numbering`, this.formData);

    request$.subscribe({
      next: () => {
        this.message.success('Data berhasil disimpan');
        this.closeDrawer();
        this.loadData();
        this.saving.set(false);
      },
      error: (err) => {
        this.message.error(err?.error?.message || 'Gagal menyimpan data');
        this.saving.set(false);
      }
    });
  }

  confirmDelete(item: DocumentNumbering) {
    const companyName = this.getCompanyName(item.company_id);
    const docTypeName = this.getDocTypeName(item.document_type_id);
    this.modal.confirm({
      nzTitle: 'Hapus Penomoran?',
      nzContent: `Yakin ingin menghapus penomoran "${companyName} - ${docTypeName}"?`,
      nzOkText: 'Hapus',
      nzOkDanger: true,
      nzCancelText: 'Batal',
      nzOnOk: () => this.delete(item.id)
    });
  }

  private delete(id: string) {
    this.http.delete(`${this.apiUrl}/numbering/${id}`).subscribe({
      next: () => {
        this.message.success('Data berhasil dihapus');
        this.loadData();
      },
      error: (err) => {
        this.message.error(err?.error?.message || 'Gagal menghapus data');
      }
    });
  }

  previewNumber() {
    if (!this.formData.company_id || !this.formData.document_type_id) {
      this.message.warning('Pilih Perusahaan dan Tipe Dokumen terlebih dahulu');
      return;
    }

    this.previewing.set(true);
    const params = `company_id=${this.formData.company_id}&document_type_id=${this.formData.document_type_id}`;
    this.http.get<any>(`${this.apiUrl}/numbering/preview?${params}`).subscribe({
      next: (res) => {
        this.previewResult.set(res.data?.preview || '-');
        this.previewing.set(false);
      },
      error: (err) => {
        this.message.error(err?.error?.message || 'Gagal memuat preview');
        this.previewResult.set('');
        this.previewing.set(false);
      }
    });
  }
}

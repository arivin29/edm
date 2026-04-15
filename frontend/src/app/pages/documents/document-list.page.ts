import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Document {
  id: string;
  document_number: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  confidentiality: string;
  current_version: number;
  revision_count: number;
  created_at: string;
  updated_at: string;
  document_type?: { id: string; name: string; code: string };
  category?: { id: string; name: string; code: string };
  creator?: { id: string; name: string; email: string };
  department?: { id: string; name: string };
}

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    NzTableModule, NzButtonModule, NzIconModule, NzTagModule,
    NzInputModule, NzSelectModule, NzCardModule, NzDropDownModule,
    NzSpinModule, NzModalModule, NzToolTipModule
  ],
  template: `
    <div class="p-4">
      <!-- Header -->
      <div class="flex justify-between items-center mb-4">
        <div>
          <h1 class="text-lg font-semibold m-0">Dokumen</h1>
          <p class="text-gray-500 text-xs m-0">Kelola semua dokumen perusahaan</p>
        </div>
        <button nz-button nzType="primary" nzSize="small" routerLink="/documents/create">
          <span nz-icon nzType="plus"></span>
          Buat Dokumen
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-5 gap-3 mb-4">
        <div class="bg-white rounded-lg border p-3 border-l-4 border-l-blue-500">
          <div class="text-xs text-gray-500">Total Dokumen</div>
          <div class="text-xl font-bold text-gray-800">{{ total() }}</div>
        </div>
        <div class="bg-white rounded-lg border p-3 border-l-4 border-l-gray-400">
          <div class="text-xs text-gray-500">Draft</div>
          <div class="text-xl font-bold text-gray-500">{{ statDraft() }}</div>
        </div>
        <div class="bg-white rounded-lg border p-3 border-l-4 border-l-blue-400">
          <div class="text-xs text-gray-500">Dalam Review</div>
          <div class="text-xl font-bold text-blue-500">{{ statReview() }}</div>
        </div>
        <div class="bg-white rounded-lg border p-3 border-l-4 border-l-green-500">
          <div class="text-xs text-gray-500">Disetujui</div>
          <div class="text-xl font-bold text-green-600">{{ statApproved() }}</div>
        </div>
        <div class="bg-white rounded-lg border p-3 border-l-4 border-l-emerald-600">
          <div class="text-xs text-gray-500">Final</div>
          <div class="text-xl font-bold text-emerald-600">{{ statFinal() }}</div>
        </div>
      </div>

      <!-- Filters -->
      <nz-card nzSize="small" class="mb-3">
        <div class="flex items-center gap-3 flex-wrap">
          <nz-input-group nzSize="small" [nzPrefix]="prefixIcon" class="w-56">
            <input nz-input nzSize="small" placeholder="Cari nomor / judul dokumen..." [(ngModel)]="searchText" (ngModelChange)="onSearch()" />
          </nz-input-group>
          <ng-template #prefixIcon><span nz-icon nzType="search"></span></ng-template>

          <nz-select nzSize="small" [(ngModel)]="filterStatus" (ngModelChange)="onFilter()"
                     nzPlaceHolder="Semua Status" nzAllowClear class="w-40">
            <nz-option nzValue="draft" nzLabel="Draft"></nz-option>
            <nz-option nzValue="in_review" nzLabel="Dalam Review"></nz-option>
            <nz-option nzValue="revision" nzLabel="Revisi"></nz-option>
            <nz-option nzValue="approved" nzLabel="Disetujui"></nz-option>
            <nz-option nzValue="final" nzLabel="Final"></nz-option>
            <nz-option nzValue="obsolete" nzLabel="Usang"></nz-option>
            <nz-option nzValue="archived" nzLabel="Diarsipkan"></nz-option>
          </nz-select>

          <nz-select nzSize="small" [(ngModel)]="filterType" (ngModelChange)="onFilter()"
                     nzPlaceHolder="Semua Tipe" nzAllowClear class="w-40">
            @for (type of documentTypes(); track type.id) {
              <nz-option [nzValue]="type.id" [nzLabel]="type.name"></nz-option>
            }
          </nz-select>

          <nz-select nzSize="small" [(ngModel)]="filterCategory" (ngModelChange)="onFilter()"
                     nzPlaceHolder="Semua Kategori" nzAllowClear class="w-40">
            @for (cat of categories(); track cat.id) {
              <nz-option [nzValue]="cat.id" [nzLabel]="cat.name"></nz-option>
            }
          </nz-select>

          <nz-select nzSize="small" [(ngModel)]="filterPriority" (ngModelChange)="onFilter()"
                     nzPlaceHolder="Prioritas" nzAllowClear class="w-36">
            <nz-option nzValue="normal" nzLabel="Normal"></nz-option>
            <nz-option nzValue="high" nzLabel="Tinggi"></nz-option>
            <nz-option nzValue="urgent" nzLabel="Mendesak"></nz-option>
          </nz-select>
        </div>
      </nz-card>

      <!-- Table -->
      <nz-card nzSize="small">
        <nz-table #docTable [nzData]="documents()" [nzLoading]="loading()"
                  nzSize="small"
                  [nzFrontPagination]="false"
                  [nzTotal]="total()"
                  [nzPageIndex]="pageIndex()"
                  [nzPageSize]="pageSize()"
                  [nzShowSizeChanger]="true"
                  [nzPageSizeOptions]="[15, 30, 50, 100]"
                  [nzShowQuickJumper]="true"
                  [nzShowTotal]="totalTemplate"
                  (nzPageIndexChange)="onPageIndexChange($event)"
                  (nzPageSizeChange)="onPageSizeChange($event)">
        <ng-template #totalTemplate let-total let-range="range">
          <span class="pagination-total">
            Menampilkan <strong>{{ range[0] }}-{{ range[1] }}</strong> dari <strong>{{ total }}</strong> dokumen
          </span>
        </ng-template>
          <thead>
            <tr>
              <th nzWidth="140px">No. Dokumen</th>
              <th>Judul</th>
              <th nzWidth="110px">Tipe</th>
              <th nzWidth="80px" nzAlign="center">Versi</th>
              <th nzWidth="90px" nzAlign="center">Status</th>
              <th nzWidth="80px" nzAlign="center">Prioritas</th>
              <th nzWidth="100px">Pembuat</th>
              <th nzWidth="90px">Tanggal</th>
              <th nzWidth="70px" nzAlign="center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            @for (doc of docTable.data; track doc.id) {
              <tr>
                <td>
                  <a [routerLink]="['/documents', doc.id]" class="text-blue-600 font-mono text-[11px] hover:underline">
                    {{ doc.document_number || '-' }}
                  </a>
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    <span nz-icon nzType="file-text" class="text-blue-400 text-sm"></span>
                    <div class="min-w-0">
                      <div class="font-medium text-xs truncate" [nz-tooltip]="doc.title">{{ doc.title }}</div>
                      @if (doc.department) {
                        <div class="text-[10px] text-gray-400 truncate">{{ doc.department.name }}</div>
                      }
                    </div>
                  </div>
                </td>
                <td>
                  @if (doc.document_type) {
                    <nz-tag nzColor="blue">{{ doc.document_type.code || doc.document_type.name }}</nz-tag>
                  } @else {
                    <span class="text-gray-300">-</span>
                  }
                </td>
                <td nzAlign="center">
                  <nz-tag nzColor="geekblue">v{{ doc.current_version || 1 }}</nz-tag>
                </td>
                <td nzAlign="center">
                  <nz-tag [nzColor]="getStatusColor(doc.status)">{{ getStatusLabel(doc.status) }}</nz-tag>
                </td>
                <td nzAlign="center">
                  <nz-tag [nzColor]="getPriorityColor(doc.priority)">{{ getPriorityLabel(doc.priority) }}</nz-tag>
                </td>
                <td>
                  @if (doc.creator) {
                    <div class="flex items-center gap-1.5">
                      <span class="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {{ doc.creator.name.charAt(0).toUpperCase() }}
                      </span>
                      <span class="text-xs truncate max-w-[70px]" [nz-tooltip]="doc.creator.name">{{ doc.creator.name }}</span>
                    </div>
                  } @else {
                    <span class="text-gray-300">-</span>
                  }
                </td>
                <td class="text-xs text-gray-500">{{ formatDate(doc.created_at) }}</td>
                <td nzAlign="center">
                  <a nz-dropdown [nzDropdownMenu]="actionMenu" nzTrigger="click">
                    <span nz-icon nzType="more" class="cursor-pointer text-gray-500 hover:text-blue-500"></span>
                  </a>
                  <nz-dropdown-menu #actionMenu="nzDropdownMenu">
                    <ul nz-menu nzSelectable>
                      <li nz-menu-item [routerLink]="['/documents', doc.id]">
                        <span nz-icon nzType="eye" class="mr-1"></span> Lihat Detail
                      </li>
                      <li nz-menu-item [routerLink]="['/documents', doc.id, 'edit']">
                        <span nz-icon nzType="edit" class="mr-1"></span> Edit
                      </li>
                      <li nz-menu-divider></li>
                      <li nz-menu-item nzDanger (click)="deleteDocument(doc)">
                        <span nz-icon nzType="delete" class="mr-1"></span> Hapus
                      </li>
                    </ul>
                  </nz-dropdown-menu>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="9" class="text-center text-gray-400 py-8">
                  <span nz-icon nzType="inbox" class="text-3xl text-gray-300 mb-2 block"></span>
                  Tidak ada dokumen ditemukan
                </td>
              </tr>
            }
          </tbody>
        </nz-table>
      </nz-card>
    </div>
  `,
  styles: [`
    :host ::ng-deep .ant-table-small .ant-table-thead > tr > th { padding: 8px; font-size: 11px; font-weight: 600; background: #fafafa; }
    :host ::ng-deep .ant-table-small .ant-table-tbody > tr > td { padding: 6px 8px; font-size: 12px; }
    :host ::ng-deep .ant-table-small .ant-table-tbody > tr:nth-child(even) { background: #fafbfc; }
    :host ::ng-deep .ant-tag { font-size: 10px; padding: 0 4px; line-height: 18px; }
    :host ::ng-deep .ant-card-body { padding: 12px; }
  `]
})
export class DocumentListPage implements OnInit {
  private http = inject(HttpClient);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);
  private route = inject(ActivatedRoute);

  documents = signal<Document[]>([]);
  documentTypes = signal<{id: string; name: string}[]>([]);
  categories = signal<{id: string; name: string}[]>([]);
  loading = signal(false);
  total = signal(0);
  pageIndex = signal(1);
  pageSize = signal(15);

  // Stats
  statDraft = signal(0);
  statReview = signal(0);
  statApproved = signal(0);
  statFinal = signal(0);

  searchText = '';
  filterStatus = '';
  filterType: string | null = null;
  filterCategory: string | null = null;
  filterPriority: string | null = null;

  ngOnInit() {
    this.loadDocumentTypes();
    this.loadCategories();
    this.loadStats();

    // React to query param changes (e.g. ?type=xxx from sidebar)
    this.route.queryParams.subscribe(params => {
      if (params['type']) {
        this.filterType = params['type'];
      } else {
        this.filterType = null;
      }
      this.pageIndex.set(1);
      this.loadDocuments();
    });
  }

  loadDocuments() {
    this.loading.set(true);
    const params: any = {
      page: this.pageIndex(),
      per_page: this.pageSize(),
      sort_by: 'created_at',
      sort_dir: 'desc'
    };
    if (this.searchText) params.search = this.searchText;
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.filterType) params.document_type_id = this.filterType;
    if (this.filterCategory) params.category_id = this.filterCategory;
    if (this.filterPriority) params.priority = this.filterPriority;

    this.http.get<any>(`${environment.apiUrl}/documents`, { params }).subscribe({
      next: (res) => {
        this.documents.set(res.data || []);
        if (res.meta) {
          this.total.set(res.meta.total || 0);
          this.pageIndex.set(res.meta.page || 1);
        }
        this.loading.set(false);
      },
      error: () => {
        this.documents.set([]);
        this.loading.set(false);
      }
    });
  }

  loadDocumentTypes() {
    this.http.get<any>(`${environment.apiUrl}/document-types`).subscribe({
      next: (res) => this.documentTypes.set(res.data || []),
      error: () => {}
    });
  }

  loadCategories() {
    this.http.get<any>(`${environment.apiUrl}/categories`).subscribe({
      next: (res) => this.categories.set(res.data || []),
      error: () => {}
    });
  }

  onSearch() {
    this.pageIndex.set(1);
    this.loadDocuments();
  }

  onFilter() {
    this.pageIndex.set(1);
    this.loadDocuments();
  }

  onPageIndexChange(index: number) {
    this.pageIndex.set(index);
    this.loadDocuments();
  }

  onPageSizeChange(size: number) {
    this.pageSize.set(size);
    this.pageIndex.set(1);
    this.loadDocuments();
  }

  loadStats() {
    // Load counts per status for stats cards
    const statuses = ['draft', 'in_review', 'approved', 'final'];
    statuses.forEach(status => {
      this.http.get<any>(`${environment.apiUrl}/documents`, { params: { status, per_page: '1' } }).subscribe({
        next: (res) => {
          const count = res.meta?.total || 0;
          if (status === 'draft') this.statDraft.set(count);
          else if (status === 'in_review') this.statReview.set(count);
          else if (status === 'approved') this.statApproved.set(count);
          else if (status === 'final') this.statFinal.set(count);
        }
      });
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  deleteDocument(doc: Document) {
    this.modal.confirm({
      nzTitle: 'Hapus Dokumen',
      nzContent: `Apakah Anda yakin ingin menghapus dokumen "<b>${doc.title}</b>"?`,
      nzOkText: 'Hapus',
      nzOkDanger: true,
      nzCancelText: 'Batal',
      nzOnOk: () => {
        this.http.delete(`${environment.apiUrl}/documents/${doc.id}`).subscribe({
          next: () => {
            this.message.success('Dokumen berhasil dihapus');
            this.loadDocuments();
          },
          error: () => this.message.error('Gagal menghapus dokumen')
        });
      }
    });
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      draft: 'default',
      in_review: 'processing',
      revision: 'warning',
      approved: 'success',
      final: 'blue',
      obsolete: 'error',
      archived: 'default'
    };
    return colors[status] || 'default';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Draft',
      in_review: 'Dalam Review',
      revision: 'Revisi',
      approved: 'Disetujui',
      final: 'Final',
      obsolete: 'Usang',
      archived: 'Diarsipkan'
    };
    return labels[status] || status;
  }

  getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      normal: 'default',
      high: 'orange',
      urgent: 'red'
    };
    return colors[priority] || 'default';
  }

  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      normal: 'Normal',
      high: 'Tinggi',
      urgent: 'Mendesak'
    };
    return labels[priority] || priority;
  }
}

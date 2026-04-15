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
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Document {
  id: string;
  document_number: string;
  title: string;
  status: string;
  priority: string;
  confidentiality: string;
  current_version: number;
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
    NzSpinModule, NzModalModule
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

      <!-- Filters -->
      <nz-card nzSize="small" class="mb-3">
        <div class="flex gap-2 flex-wrap">
          <nz-input-group nzSize="small" [nzPrefix]="prefixIcon" class="w-48">
            <input nz-input placeholder="Cari dokumen..." [(ngModel)]="searchText" (ngModelChange)="onSearch()" />
          </nz-input-group>
          <ng-template #prefixIcon><span nz-icon nzType="search"></span></ng-template>
          
          <nz-select nzSize="small" [(ngModel)]="filterStatus" (ngModelChange)="onFilter()" 
                     nzPlaceHolder="Status" nzAllowClear class="w-32">
            <nz-option nzValue="draft" nzLabel="Draft"></nz-option>
            <nz-option nzValue="in_review" nzLabel="Dalam Review"></nz-option>
            <nz-option nzValue="revision" nzLabel="Revisi"></nz-option>
            <nz-option nzValue="approved" nzLabel="Disetujui"></nz-option>
            <nz-option nzValue="final" nzLabel="Final"></nz-option>
            <nz-option nzValue="obsolete" nzLabel="Usang"></nz-option>
            <nz-option nzValue="archived" nzLabel="Diarsipkan"></nz-option>
          </nz-select>

          <nz-select nzSize="small" [(ngModel)]="filterType" (ngModelChange)="onFilter()" 
                     nzPlaceHolder="Tipe" nzAllowClear class="w-32">
            @for (type of documentTypes(); track type.id) {
              <nz-option [nzValue]="type.id" [nzLabel]="type.name"></nz-option>
            }
          </nz-select>

          <nz-select nzSize="small" [(ngModel)]="filterCategory" (ngModelChange)="onFilter()" 
                     nzPlaceHolder="Kategori" nzAllowClear class="w-32">
            @for (cat of categories(); track cat.id) {
              <nz-option [nzValue]="cat.id" [nzLabel]="cat.name"></nz-option>
            }
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
                  [nzPageSizeOptions]="[15, 30, 50]"
                  (nzPageIndexChange)="onPageIndexChange($event)"
                  (nzPageSizeChange)="onPageSizeChange($event)">
          <thead>
            <tr>
              <th nzWidth="140px">No. Dokumen</th>
              <th>Judul</th>
              <th nzWidth="100px">Tipe</th>
              <th nzWidth="100px">Kategori</th>
              <th nzWidth="90px">Status</th>
              <th nzWidth="80px">Prioritas</th>
              <th nzWidth="100px">Pembuat</th>
              <th nzWidth="90px">Tanggal</th>
              <th nzWidth="70px">Aksi</th>
            </tr>
          </thead>
          <tbody>
            @for (doc of docTable.data; track doc.id) {
              <tr>
                <td><a [routerLink]="['/documents', doc.id]" class="text-blue-600">{{ doc.document_number || '-' }}</a></td>
                <td>{{ doc.title }}</td>
                <td>{{ doc.document_type?.name || '-' }}</td>
                <td>{{ doc.category?.name || '-' }}</td>
                <td><nz-tag [nzColor]="getStatusColor(doc.status)">{{ getStatusLabel(doc.status) }}</nz-tag></td>
                <td><nz-tag [nzColor]="getPriorityColor(doc.priority)">{{ getPriorityLabel(doc.priority) }}</nz-tag></td>
                <td>{{ doc.creator?.name || '-' }}</td>
                <td>{{ doc.created_at | date:'dd/MM/yy' }}</td>
                <td>
                  <a nz-dropdown [nzDropdownMenu]="actionMenu" nzTrigger="click">
                    <span nz-icon nzType="more" class="cursor-pointer"></span>
                  </a>
                  <nz-dropdown-menu #actionMenu="nzDropdownMenu">
                    <ul nz-menu nzSelectable>
                      <li nz-menu-item [routerLink]="['/documents', doc.id]">
                        <span nz-icon nzType="eye"></span> Lihat
                      </li>
                      <li nz-menu-item [routerLink]="['/documents', doc.id, 'edit']">
                        <span nz-icon nzType="edit"></span> Edit
                      </li>
                      <li nz-menu-item nzDanger (click)="deleteDocument(doc)">
                        <span nz-icon nzType="delete"></span> Hapus
                      </li>
                    </ul>
                  </nz-dropdown-menu>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="9" class="text-center text-gray-500 py-8">
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
    :host ::ng-deep .ant-table-small .ant-table-thead > tr > th { padding: 8px; font-size: 12px; }
    :host ::ng-deep .ant-table-small .ant-table-tbody > tr > td { padding: 6px 8px; font-size: 12px; }
    :host ::ng-deep .ant-tag { font-size: 11px; }
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

  searchText = '';
  filterStatus = '';
  filterType: string | null = null;
  filterCategory: string | null = null;

  ngOnInit() {
    this.loadDocumentTypes();
    this.loadCategories();

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

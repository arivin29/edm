import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMessageService } from 'ng-zorro-antd/message';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Document {
  id: number;
  document_number: string;
  title: string;
  type_name: string;
  category_name: string;
  status: string;
  creator_name: string;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    NzTableModule, NzButtonModule, NzIconModule, NzTagModule,
    NzInputModule, NzSelectModule, NzCardModule, NzDropDownModule
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
            <nz-option nzValue="in_review" nzLabel="In Review"></nz-option>
            <nz-option nzValue="approved" nzLabel="Approved"></nz-option>
            <nz-option nzValue="final" nzLabel="Final"></nz-option>
            <nz-option nzValue="archived" nzLabel="Archived"></nz-option>
          </nz-select>

          <nz-select nzSize="small" [(ngModel)]="filterType" (ngModelChange)="onFilter()" 
                     nzPlaceHolder="Tipe" nzAllowClear class="w-32">
            @for (type of documentTypes(); track type.id) {
              <nz-option [nzValue]="type.id" [nzLabel]="type.name"></nz-option>
            }
          </nz-select>
        </div>
      </nz-card>

      <!-- Table -->
      <nz-card nzSize="small">
        <nz-table #docTable [nzData]="documents()" [nzLoading]="loading()" 
                  nzSize="small" [nzPageSize]="15" [nzShowSizeChanger]="true">
          <thead>
            <tr>
              <th nzWidth="140px">No. Dokumen</th>
              <th>Judul</th>
              <th nzWidth="100px">Tipe</th>
              <th nzWidth="100px">Kategori</th>
              <th nzWidth="90px">Status</th>
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
                <td>{{ doc.type_name }}</td>
                <td>{{ doc.category_name }}</td>
                <td><nz-tag [nzColor]="getStatusColor(doc.status)">{{ getStatusLabel(doc.status) }}</nz-tag></td>
                <td>{{ doc.creator_name }}</td>
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
                <td colspan="8" class="text-center text-gray-500 py-8">
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

  documents = signal<Document[]>([]);
  documentTypes = signal<{id: number; name: string}[]>([]);
  loading = signal(false);

  searchText = '';
  filterStatus = '';
  filterType: number | null = null;

  ngOnInit() {
    this.loadDocuments();
    this.loadDocumentTypes();
  }

  loadDocuments() {
    this.loading.set(true);
    const params: any = {};
    if (this.searchText) params.search = this.searchText;
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.filterType) params.type_id = this.filterType;

    this.http.get<any>(`${environment.apiUrl}/documents`, { params }).subscribe({
      next: (res) => {
        this.documents.set(res.data || []);
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

  onSearch() {
    this.loadDocuments();
  }

  onFilter() {
    this.loadDocuments();
  }

  deleteDocument(doc: Document) {
    if (confirm(`Hapus dokumen "${doc.title}"?`)) {
      this.http.delete(`${environment.apiUrl}/documents/${doc.id}`).subscribe({
        next: () => {
          this.message.success('Dokumen berhasil dihapus');
          this.loadDocuments();
        },
        error: () => this.message.error('Gagal menghapus dokumen')
      });
    }
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      draft: 'default',
      in_review: 'processing',
      approved: 'success',
      final: 'blue',
      archived: 'default',
      revision: 'warning'
    };
    return colors[status] || 'default';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Draft',
      in_review: 'Review',
      approved: 'Approved',
      final: 'Final',
      archived: 'Archived',
      revision: 'Revisi'
    };
    return labels[status] || status;
  }
}

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
import { environment } from '../../../../environments/environment';
import { DocumentItem, DocumentDetail, WorkflowStep, getStatusColor, getStatusLabel, getPriorityColor, getPriorityLabel, formatDate } from '../document.models';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    NzTableModule, NzButtonModule, NzIconModule, NzTagModule,
    NzInputModule, NzSelectModule, NzCardModule, NzDropDownModule,
    NzSpinModule, NzModalModule, NzToolTipModule
  ],
  templateUrl: './document-list.component.html',
  styleUrls: ['./document-list.component.scss']
})
export class DocumentListPage implements OnInit {
  private http = inject(HttpClient);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);
  private route = inject(ActivatedRoute);

  documents = signal<DocumentItem[]>([]);
  documentTypes = signal<{id: string; name: string}[]>([]);
  categories = signal<{id: string; name: string}[]>([]);
  loading = signal(false);
  total = signal(0);
  pageIndex = signal(1);
  pageSize = signal(15);

  statDraft = signal(0);
  statReview = signal(0);
  statApproved = signal(0);
  statFinal = signal(0);

  searchText = '';
  filterStatus = '';
  filterType: string | null = null;
  filterCategory: string | null = null;
  filterPriority: string | null = null;

  // Expose helper functions to template
  getStatusColor = getStatusColor;
  getStatusLabel = getStatusLabel;
  getPriorityColor = getPriorityColor;
  getPriorityLabel = getPriorityLabel;
  formatDate = formatDate;

  // Expand row state (signals for proper change detection)
  expandSet = signal<Set<string>>(new Set());
  expandData = signal<Map<string, DocumentDetail>>(new Map());
  expandWorkflow = signal<Map<string, WorkflowStep[]>>(new Map());
  expandLoading = signal<Set<string>>(new Set());

  ngOnInit() {
    this.loadDocumentTypes();
    this.loadCategories();
    this.loadStats();

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

  deleteDocument(doc: DocumentItem) {
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

  onExpandChange(doc: DocumentItem, expanded: boolean) {
    if (expanded) {
      this.expandSet.update(s => { const ns = new Set(s); ns.add(doc.id); return ns; });
      if (!this.expandData().has(doc.id)) {
        this.loadExpandDetail(doc.id);
      }
    } else {
      this.expandSet.update(s => { const ns = new Set(s); ns.delete(doc.id); return ns; });
    }
  }

  private loadExpandDetail(docId: string) {
    this.expandLoading.update(s => { const ns = new Set(s); ns.add(docId); return ns; });

    this.http.get<any>(`${environment.apiUrl}/documents/${docId}`).subscribe({
      next: (res) => {
        this.expandData.update(m => { const nm = new Map(m); nm.set(docId, res.data || res); return nm; });
        this.expandLoading.update(s => { const ns = new Set(s); ns.delete(docId); return ns; });
      },
      error: () => this.expandLoading.update(s => { const ns = new Set(s); ns.delete(docId); return ns; })
    });

    this.http.get<any>(`${environment.apiUrl}/documents/${docId}/workflow`).subscribe({
      next: (res) => {
        const steps = res.data?.steps || res.steps || res.data || [];
        this.expandWorkflow.update(m => { const nm = new Map(m); nm.set(docId, steps); return nm; });
      },
      error: () => this.expandWorkflow.update(m => { const nm = new Map(m); nm.set(docId, []); return nm; })
    });
  }

  getConfidentialityLabel(value: string): string {
    const labels: Record<string, string> = {
      public: 'Publik', internal: 'Internal', confidential: 'Rahasia', secret: 'Sangat Rahasia'
    };
    return labels[value] || value || '-';
  }

  getStepActionLabel(action: string): string {
    const labels: Record<string, string> = {
      review: 'Review', approve: 'Approval', sign: 'Tanda Tangan', acknowledge: 'Acknowledge'
    };
    return labels[action] || action || '';
  }
}

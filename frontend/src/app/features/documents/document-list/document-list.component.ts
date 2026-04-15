import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataTableComponent, TableColumn, TableAction, TableSort } from '../../../shared/components/data-table/data-table.component';
import { PageHeaderComponent, BreadcrumbItem } from '../../../shared/components/page-header/page-header.component';
import { DrawerComponent } from '../../../shared/components/drawer/drawer.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { DocumentFormComponent } from '../document-form/document-form.component';
import { DocumentQuickViewComponent } from '../document-quick-view/document-quick-view.component';
import { DocumentsService } from '../../../api/services/documents.service';
import { WorkflowActionsService } from '../../../api/services/workflow-actions.service';
import { AuthStateService } from '../../../core/auth/auth-state.service';

interface Document {
  id: string;
  document_number: string;
  title: string;
  status: string;
  document_type: { name: string };
  category: { name: string };
  created_by_user: { name: string };
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [
    CommonModule,
    DataTableComponent,
    PageHeaderComponent,
    DrawerComponent,
    ConfirmModalComponent,
    DocumentFormComponent,
    DocumentQuickViewComponent
  ],
  templateUrl: './document-list.component.html',
  styleUrl: './document-list.component.scss'
})
export class DocumentListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly documentsApi = inject(DocumentsService);
  private readonly workflowActionsApi = inject(WorkflowActionsService);
  private readonly authState = inject(AuthStateService);

  // Page config
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', link: '/dashboard' },
    { label: 'Dokumen' }
  ];

  // Table config
  columns: TableColumn[] = [
    { key: 'document_number', label: 'No. Dokumen', sortable: true, width: '160px' },
    { key: 'title', label: 'Judul', sortable: true },
    {
      key: 'document_type',
      label: 'Tipe',
      width: '100px',
      format: (val: any) => val?.name || '-'
    },
    {
      key: 'category',
      label: 'Kategori',
      width: '120px',
      format: (val: any) => val?.name || '-'
    },
    {
      key: 'status',
      label: 'Status',
      type: 'badge',
      width: '120px',
      badgeMap: {
        'draft': { label: 'Draft', class: 'badge-gray' },
        'in_review': { label: 'Review', class: 'badge-primary' },
        'revision': { label: 'Revisi', class: 'badge-warning' },
        'approved': { label: 'Disetujui', class: 'badge-success' },
        'final': { label: 'Final', class: 'badge-success' }
      }
    },
    {
      key: 'created_by_user',
      label: 'Pembuat',
      width: '140px',
      format: (val) => val?.name || '-'
    },
    {
      key: 'updated_at',
      label: 'Diperbarui',
      type: 'datetime',
      sortable: true,
      width: '140px'
    }
  ];

  actions: TableAction[] = [
    { key: 'view', label: 'Lihat Detail' },
    { key: 'edit', label: 'Edit', permission: 'document.update', show: (row) => row.status === 'draft' },
    { key: 'submit', label: 'Submit Review', permission: 'document.submit', show: (row) => row.status === 'draft' },
    { key: 'delete', label: 'Hapus', class: 'danger', permission: 'document.delete', show: (row) => row.status === 'draft' }
  ];

  // Data state
  documents = signal<Document[]>([]);
  loading = signal(true);
  totalItems = signal(0);
  currentPage = signal(1);
  pageSize = signal(20);
  searchQuery = signal('');
  currentSort = signal<TableSort | null>({ column: 'updated_at', direction: 'desc' });

  // UI state
  formDrawerOpen = signal(false);
  quickViewOpen = signal(false);
  deleteModalOpen = signal(false);
  selectedDocument = signal<Document | null>(null);
  formMode = signal<'create' | 'edit'>('create');
  isSubmitting = signal(false);

  // Permissions
  canCreate = computed(() => this.authState.hasPermission('document.create'));

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.loading.set(true);

    const params: any = {
      page: this.currentPage(),
      per_page: this.pageSize(),
      search: this.searchQuery() || undefined
    };

    const sort = this.currentSort();
    if (sort) {
      params.sort_by = sort.column;
      params.sort_dir = sort.direction;
    }

    this.documentsApi.documentsGet(params).subscribe({
      next: (response: any) => {
        this.documents.set(response?.data || response || []);
        this.totalItems.set(response?.meta?.total || 0);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  // Table events
  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadDocuments();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.loadDocuments();
  }

  onSortChange(sort: TableSort | null): void {
    this.currentSort.set(sort);
    this.loadDocuments();
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
    this.loadDocuments();
  }

  onRowClick(document: Document): void {
    this.selectedDocument.set(document);
    this.quickViewOpen.set(true);
  }

  onActionClick(event: { action: string; row: Document }): void {
    const { action, row } = event;

    switch (action) {
      case 'view':
        this.router.navigate(['/documents', row.id]);
        break;
      case 'edit':
        this.selectedDocument.set(row);
        this.formMode.set('edit');
        this.formDrawerOpen.set(true);
        break;
      case 'submit':
        this.submitForReview(row);
        break;
      case 'delete':
        this.selectedDocument.set(row);
        this.deleteModalOpen.set(true);
        break;
    }
  }

  // Actions
  openCreateForm(): void {
    this.selectedDocument.set(null);
    this.formMode.set('create');
    this.formDrawerOpen.set(true);
  }

  closeFormDrawer(): void {
    this.formDrawerOpen.set(false);
    this.selectedDocument.set(null);
  }

  closeQuickView(): void {
    this.quickViewOpen.set(false);
  }

  onFormSaved(): void {
    this.closeFormDrawer();
    this.loadDocuments();
  }

  goToDetail(): void {
    const doc = this.selectedDocument();
    if (doc) {
      this.quickViewOpen.set(false);
      this.router.navigate(['/documents', doc.id]);
    }
  }

  editFromQuickView(): void {
    this.quickViewOpen.set(false);
    this.formMode.set('edit');
    this.formDrawerOpen.set(true);
  }

  submitForReview(document: Document): void {
    this.workflowActionsApi.documentsIdSubmitPost({ id: document.id }).subscribe({
      next: () => {
        this.loadDocuments();
      }
    });
  }

  confirmDelete(): void {
    const doc = this.selectedDocument();
    if (!doc) return;

    this.isSubmitting.set(true);
    this.documentsApi.documentsIdDelete({ id: doc.id }).subscribe({
      next: () => {
        this.deleteModalOpen.set(false);
        this.selectedDocument.set(null);
        this.isSubmitting.set(false);
        this.loadDocuments();
      },
      error: () => {
        this.isSubmitting.set(false);
      }
    });
  }

  cancelDelete(): void {
    this.deleteModalOpen.set(false);
    this.selectedDocument.set(null);
  }
}

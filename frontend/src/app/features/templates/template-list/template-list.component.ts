import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent, TableColumn, TableAction } from '../../../shared/components/data-table/data-table.component';
import { PageHeaderComponent, BreadcrumbItem } from '../../../shared/components/page-header/page-header.component';
import { TemplatesService } from '../../../api/services/templates.service';

@Component({
  selector: 'app-template-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent, PageHeaderComponent],
  template: `
    <div class="page">
      <app-page-header
        title="Template Dokumen"
        subtitle="Kelola template untuk pembuatan dokumen"
        [breadcrumbs]="breadcrumbs"
      >
        <button class="btn btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Tambah Template
        </button>
      </app-page-header>

      <app-data-table
        [columns]="columns"
        [data]="items()"
        [loading]="loading()"
        [totalItems]="totalItems()"
        [actions]="actions"
        searchPlaceholder="Cari template..."
        emptyMessage="Belum ada template"
        (pageChange)="onPageChange($event)"
        (actionClick)="onAction($event)"
      />
    </div>
  `,
  styles: [`
    .page { padding: 24px; }
    .btn {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 20px; border-radius: 8px; border: none;
      font-size: 14px; font-weight: 500; cursor: pointer;
    }
    .btn-primary { background: #3b82f6; color: #fff; }
    .btn-primary:hover { background: #2563eb; }
  `]
})
export class TemplateListComponent implements OnInit {
  private readonly api = inject(TemplatesService);

  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', link: '/dashboard' },
    { label: 'Template' }
  ];

  columns: TableColumn[] = [
    { key: 'name', label: 'Nama Template', sortable: true },
    { key: 'document_type', label: 'Tipe Dokumen', format: (v) => v?.name || '-' },
    { key: 'category', label: 'Kategori', format: (v) => v?.name || '-' },
    { key: 'version', label: 'Versi', width: '80px' },
    {
      key: 'is_active',
      label: 'Status',
      type: 'badge',
      width: '100px',
      badgeMap: {
        'true': { label: 'Aktif', class: 'badge-success' },
        'false': { label: 'Nonaktif', class: 'badge-gray' }
      },
      format: (v) => String(v)
    },
    { key: 'updated_at', label: 'Diperbarui', type: 'datetime', width: '140px' }
  ];

  actions: TableAction[] = [
    { key: 'edit', label: 'Edit' },
    { key: 'download', label: 'Download' },
    { key: 'preview', label: 'Preview' },
    { key: 'delete', label: 'Hapus', class: 'danger' }
  ];

  items = signal<any[]>([]);
  loading = signal(true);
  totalItems = signal(0);
  currentPage = signal(1);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.templatesGet({ page: this.currentPage() }).subscribe({
      next: (res: any) => {
        this.items.set(res?.data || res || []);
        this.totalItems.set(res?.meta?.total || 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.load();
  }

  onAction(event: { action: string; row: any }): void {
    console.log('Action:', event);
  }
}

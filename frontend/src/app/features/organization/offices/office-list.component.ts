import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent, TableColumn, TableAction } from '../../../shared/components/data-table/data-table.component';
import { PageHeaderComponent, BreadcrumbItem } from '../../../shared/components/page-header/page-header.component';
import { OfficesService } from '../../../api/services/offices.service';

@Component({
  selector: 'app-office-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent, PageHeaderComponent],
  template: `
    <div class="page">
      <app-page-header title="Kantor" subtitle="Kelola data kantor" [breadcrumbs]="breadcrumbs">
        <button class="btn btn-primary" (click)="openForm()">+ Tambah</button>
      </app-page-header>
      <app-data-table
        [columns]="columns" [data]="items()" [loading]="loading()" [totalItems]="totalItems()" [actions]="actions"
        emptyMessage="Belum ada data" (pageChange)="onPageChange($event)" (actionClick)="onAction($event)"
      />
    </div>
  `,
  styles: [`.page { padding: 24px; } .btn { padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; } .btn-primary { background: #3b82f6; color: #fff; }`]
})
export class OfficeListComponent implements OnInit {
  private readonly api = inject(OfficesService);
  breadcrumbs: BreadcrumbItem[] = [{ label: 'Dashboard', link: '/dashboard' }, { label: 'Organisasi', link: '/organization' }, { label: 'Kantor' }];
  columns: TableColumn[] = [
    { key: 'code', label: 'Kode', width: '100px' },
    { key: 'name', label: 'Nama Kantor', sortable: true },
    { key: 'company', label: 'Perusahaan', format: (v) => v?.name || '-' },
    { key: 'address', label: 'Alamat' }
  ];
  actions: TableAction[] = [{ key: 'edit', label: 'Edit' }, { key: 'delete', label: 'Hapus', class: 'danger' }];
  items = signal<any[]>([]); loading = signal(true); totalItems = signal(0); currentPage = signal(1);

  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading.set(true);
    this.api.officesGet({ page: this.currentPage() }).subscribe({
      next: (res: any) => { this.items.set(res?.data || res || []); this.totalItems.set(res?.meta?.total || 0); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
  onPageChange(page: number): void { this.currentPage.set(page); this.load(); }
  onAction(e: any): void { console.log(e); }
  openForm(): void {}
}
